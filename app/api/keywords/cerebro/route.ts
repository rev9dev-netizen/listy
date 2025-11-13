import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
    fetchKeywordIntersections,
    fetchRankedKeywords,
    type KeywordIntersectionItem
} from '@/lib/dataforseo'
import { cache } from '@/lib/redis'
import { prisma } from '@/lib/prisma'

type CerebroRequest = {
    asins: string[]
    marketplace?: string
    saveToDb?: boolean
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = (await req.json()) as CerebroRequest
        const { asins, marketplace = 'US', saveToDb = true } = body

        if (!asins || asins.length === 0) {
            return NextResponse.json({ error: 'At least one ASIN required' }, { status: 400 })
        }

        if (asins.length > 10) {
            return NextResponse.json({ error: 'Maximum 10 ASINs allowed' }, { status: 400 })
        }

        // Get user record
        const user = await prisma.user.findUnique({ where: { clerkId: userId } })
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const allKeywords: Array<{
            keyword: string
            searchVolume: number
            organicRank: number | null
            sponsoredRank: number | null
            competingProducts: number
            asinSources: string[]
        }> = []

        // Step 1: Fetch keyword intersections for all ASINs
        // This uses the product_keyword_intersections endpoint which is designed for reverse ASIN lookup
        console.log(`Fetching keyword intersections for ${asins.length} ASIN(s)...`)

        const cacheKey = `cerebro:intersect:${marketplace}:${asins.sort().join(',')}`
        let intersectionItems: KeywordIntersectionItem[] = await cache.get<KeywordIntersectionItem[]>(cacheKey) || []

        if (intersectionItems.length === 0) {
            console.log(`Cache miss, fetching from DataForSEO...`)

            try {
                // Try product_keyword_intersections first (more comprehensive)
                // Use 'intersect' for single ASIN, 'union' for multiple ASINs
                const mode = asins.length === 1 ? 'intersect' : 'union'
                console.log(`Trying product_keyword_intersections with mode: ${mode}...`)
                intersectionItems = await fetchKeywordIntersections(asins, marketplace, 1000, mode)
                console.log(`✓ Fetched ${intersectionItems.length} keyword intersections`)

                // If product_keyword_intersections returns 0 results, use fallback
                if (intersectionItems.length === 0) {
                    throw new Error('product_keyword_intersections returned 0 results')
                }
            } catch (error) {
                console.error(`✗ product_keyword_intersections failed:`, error)
                console.log(`Falling back to ranked_keywords endpoint...`)

                // Fallback: Use ranked_keywords for each ASIN
                const allRankedItems: KeywordIntersectionItem[] = []
                for (const asin of asins) {
                    try {
                        const rankedItems = await fetchRankedKeywords(asin, marketplace, 1000)
                        console.log(`✓ Fetched ${rankedItems.length} ranked keywords for ${asin}`)

                        // Convert RankedKeywordItem to KeywordIntersectionItem format
                        const converted: KeywordIntersectionItem[] = rankedItems.map((item) => {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const serpItem = item.ranked_serp_element?.serp_item as any // DataForSEO has additional fields
                            return {
                                keyword_data: item.keyword_data,
                                intersection_result: {
                                    [String(asins.indexOf(asin) + 1)]: {
                                        se_type: serpItem?.type,
                                        type: serpItem?.type,
                                        rank_absolute: serpItem?.rank_absolute,
                                        rank_group: serpItem?.rank_group,
                                        is_paid: serpItem?.is_paid,
                                        title: serpItem?.title,
                                        url: serpItem?.url,
                                        asin: serpItem?.asin || asin,
                                        image_url: serpItem?.image_url,
                                        price_from: serpItem?.price?.current,
                                        rating: serpItem?.rating,
                                    }
                                }
                            }
                        })

                        allRankedItems.push(...converted)
                    } catch (asinError) {
                        console.error(`Failed to fetch keywords for ${asin}:`, asinError)
                    }
                }

                intersectionItems = allRankedItems
                console.log(`✓ Total keywords from fallback: ${intersectionItems.length}`)
            }

            if (intersectionItems.length > 0) {
                await cache.set(cacheKey, intersectionItems, 3600) // 1 hour cache
            }
        } else {
            console.log(`Cache hit, using ${intersectionItems.length} cached keywords`)
        }

        // Debug: Log first few items to understand the data structure
        if (intersectionItems.length > 0) {
            console.log(`Sample raw data:`)
            console.log(JSON.stringify(intersectionItems.slice(0, 2), null, 2))
        }

        // Filter keywords to only include those updated within the last 30 days
        const now = new Date()
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        console.log(`Filtering keywords updated between ${thirtyDaysAgo.toISOString().split('T')[0]} and ${now.toISOString().split('T')[0]}`)

        let debugCount = 0;
        const recentItems = intersectionItems.filter(item => {
            const lastUpdated = item.keyword_data?.keyword_info?.last_updated_time
            if (!lastUpdated) {
                // If no update time, we'll skip it to ensure data freshness
                return false
            }

            const updateDate = new Date(lastUpdated)
            const isRecent = updateDate >= thirtyDaysAgo && updateDate <= now

            // Log first few filtered keywords for debugging
            if (debugCount < 3 && isRecent) {
                console.log(`  Keyword "${item.keyword_data?.keyword}": updated ${lastUpdated} - INCLUDED`)
                debugCount++;
            }

            return isRecent
        })

        console.log(`Filtered to ${recentItems.length} keywords updated in the last 30 days (from ${intersectionItems.length} total)`)

        if (recentItems.length === 0) {
            console.warn('No keywords found with updates in the last 30 days!')
        }

        // Process each keyword from the intersection results
        for (const item of recentItems) {
            const keyword = item.keyword_data?.keyword
            if (!keyword) {
                console.log('Skipping item - no keyword:', item)
                continue
            }

            // Search volume from keyword_info
            const searchVolume = item.keyword_data?.keyword_info?.search_volume || 0

            // Debug first few keywords
            if (allKeywords.length < 5) {
                console.log(`Processing keyword #${allKeywords.length + 1}: "${keyword}"`)
                console.log(`  - Search Volume: ${searchVolume}`)
                console.log(`  - Intersection results:`, Object.keys(item.intersection_result || {}))
            }

            // Process each ASIN's ranking for this keyword
            let organicRank: number | null = null
            let sponsoredRank: number | null = null
            const matchedAsins: string[] = []

            // The intersection_result has keys like "1", "2", etc. corresponding to ASIN positions
            const intersectionResult = item.intersection_result || {}
            for (const [asinKey, rankData] of Object.entries(intersectionResult)) {
                const asinIndex = parseInt(asinKey) - 1 // API uses 1-based indexing
                if (asinIndex >= 0 && asinIndex < asins.length) {
                    const asin = asins[asinIndex]
                    matchedAsins.push(asin)

                    const rankAbsolute = rankData.rank_absolute
                    const isPaid = rankData.type === 'amazon_paid' || rankData.type?.includes('paid')

                    if (rankAbsolute) {
                        if (isPaid) {
                            if (!sponsoredRank || rankAbsolute < sponsoredRank) {
                                sponsoredRank = rankAbsolute
                            }
                        } else {
                            if (!organicRank || rankAbsolute < organicRank) {
                                organicRank = rankAbsolute
                            }
                        }
                    }

                    if (allKeywords.length < 3) {
                        console.log(`  - ASIN ${asin}: Rank ${rankAbsolute}, Type: ${rankData.type}, isPaid: ${isPaid}`)
                    }
                }
            }

            // Count competing products from intersection_result
            const competingProducts = Object.keys(intersectionResult).length

            allKeywords.push({
                keyword,
                searchVolume,
                organicRank,
                sponsoredRank,
                competingProducts,
                asinSources: matchedAsins,
            })
        }

        console.log(`Total keywords collected: ${allKeywords.length}`)
        console.log(`Sample keywords:`, allKeywords.slice(0, 5).map(k => ({
            keyword: k.keyword,
            sv: k.searchVolume,
            organic: k.organicRank,
            sponsored: k.sponsoredRank,
            competing: k.competingProducts
        })))

        // Calculate derived metrics and format response
        const formattedKeywords = allKeywords.map((kw) => {
            // Match type
            let matchType = '-'
            if (kw.organicRank && kw.sponsoredRank) matchType = 'O+SP'
            else if (kw.organicRank) matchType = 'O'
            else if (kw.sponsoredRank) matchType = 'SP'

            return {
                phrase: kw.keyword,
                search_volume: kw.searchVolume,
                organic_rank: kw.organicRank,
                sponsored_rank: kw.sponsoredRank,
                competing_products: kw.competingProducts,
                match_type: matchType,
                // Future: these would come from additional API calls or calculations
                // search_volume_trend: null,
                // title_density: null,
                // keyword_sales: null,
                // suggested_ppc_bid: null,
            }
        })

        // Sort by search volume (most popular keywords first)
        formattedKeywords.sort((a, b) => (b.search_volume || 0) - (a.search_volume || 0))

        // Save to database if requested
        if (saveToDb && formattedKeywords.length > 0) {

            // Delete old research for these ASINs
            await prisma.keywordResearch.deleteMany({
                where: {
                    userId: user.id,
                    asin: { in: asins },
                    marketplace,
                },
            })

            // Batch insert new results - only save real data
            await prisma.keywordResearch.createMany({
                data: formattedKeywords.flatMap(kw =>
                    asins.map(asin => ({
                        userId: user.id,
                        asin,
                        marketplace,
                        keyword: kw.phrase,
                        searchVolume: kw.search_volume,
                        organicRank: kw.organic_rank,
                        sponsoredRank: kw.sponsored_rank,
                        competingProducts: kw.competing_products,
                        matchType: kw.match_type,
                        // Leave other fields null for now - we'll add them when we have real data
                        titleDensity: null,
                        searchVolumeTrend: null,
                        cerebro_iq_score: null,
                        suggested_ppc_bid: null,
                        keyword_sales: null,
                        cpr: null,
                        sponsored_asins: null,
                    }))
                ),
                skipDuplicates: true,
            })

        }

        // Product info summary
        // Extract product image from the first keyword's intersection result
        let productImage = '/placeholder-product.jpg';
        let productTitle = `Analysis of ${asins.length} ASIN${asins.length > 1 ? 's' : ''}: ${asins.join(', ')}`;

        if (recentItems.length > 0 && recentItems[0].intersection_result) {
            const firstResult = Object.values(recentItems[0].intersection_result)[0];
            if (firstResult?.image_url) {
                productImage = firstResult.image_url;
            }
            if (firstResult?.title) {
                productTitle = firstResult.title;
            }
        }

        const productInfo = {
            title: productTitle,
            image: productImage,
            asin: asins[0], // Include first ASIN for product link
            total_keywords: formattedKeywords.length,
            organic_keywords: formattedKeywords.filter((k) => k.organic_rank !== null).length,
            paid_keywords: formattedKeywords.filter((k) => k.sponsored_rank !== null).length,
            amazon_recommended: 0,
            total_search_volume: formattedKeywords.reduce((sum, k) => sum + k.search_volume, 0),
            avg_search_volume: formattedKeywords.length > 0
                ? Math.floor(formattedKeywords.reduce((sum, k) => sum + k.search_volume, 0) / formattedKeywords.length)
                : 0,
        }

        return NextResponse.json({
            keywords: formattedKeywords,
            productInfo,
            cached: false,
            asins,
            marketplace,
            dateRange: {
                from: thirtyDaysAgo.toISOString().split('T')[0],
                to: now.toISOString().split('T')[0],
                description: 'Keywords updated in the last 30 days'
            }
        })
    } catch (error: unknown) {
        console.error('Cerebro keyword research failed:', error)
        const msg = error instanceof Error ? error.message : 'Failed to fetch keywords'
        return NextResponse.json(
            { error: msg },
            { status: 500 }
        )
    }
}