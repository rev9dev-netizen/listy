import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/databse/prisma'
import { generateKeywords } from '@/lib/services/keyword-service'
import { getOrCreateUser } from '@/lib/auth-helpers'
import type { KeywordGenerationRequest } from '@/lib/types'

export async function POST(request: NextRequest) {
    try {
        const user = await getOrCreateUser()

        const body = (await request.json()) as KeywordGenerationRequest

        // Validate request
        if (!body.marketplace) {
            return NextResponse.json({ error: 'Marketplace is required' }, { status: 400 })
        }

        // Generate keywords
        const keywords = await generateKeywords({
            marketplace: body.marketplace,
            asin_list: body.asin_list,
            seeds: body.seeds,
            category: body.category,
        })

        // Store in database linked to user
        const storeInDB = request.nextUrl.searchParams.get('save') === 'true'
        if (storeInDB) {
            // Delete existing keywords for this user (optional - or keep accumulating)
            // For now, we'll keep accumulating keywords

            // Insert new keywords
            await prisma.keyword.createMany({
                data: keywords.map((k) => ({
                    userId: user.id,
                    term: k.term,
                    score: k.score,
                    clusterId: k.cluster_id,
                    class: k.class,
                    source: k.source,
                    included: true,
                })),
                skipDuplicates: true, // Don't fail on duplicate keywords
            })
        }

        return NextResponse.json({ keywords })
    } catch (error) {
        console.error('Error generating keywords:', error)
        return NextResponse.json({ error: 'Failed to generate keywords' }, { status: 500 })
    }
}

export async function GET() {
    try {
        const user = await getOrCreateUser()

        // Get all keywords for this user
        const keywords = await prisma.keyword.findMany({
            where: {
                userId: user.id,
            },
            orderBy: {
                score: 'desc',
            },
        })

        return NextResponse.json({
            keywords: keywords.map((k) => ({
                term: k.term,
                score: k.score,
                cluster_id: k.clusterId || '',
                class: k.class,
                source: k.source,
                included: k.included,
            }))
        })
    } catch (error) {
        console.error('Error fetching keywords:', error)
        return NextResponse.json({ error: 'Failed to fetch keywords' }, { status: 500 })
    }
}
