import { openai } from '../openai'
import { cache } from '../redis'
import type { Keyword, Cluster } from '../types'

/**
 * Keyword Generation Service
 * Implements the keyword extraction, scoring, clustering, and classification pipeline
 */

interface RawKeywordData {
    term: string
    frequency: number
    position: number
    source: string
}

// Normalize keywords (lowercase, trim, dedupe)
export function normalizeKeywords(keywords: string[]): string[] {
    const normalized = new Set<string>()
    for (const keyword of keywords) {
        const cleaned = keyword
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, ' ')
        if (cleaned.length > 2) {
            normalized.add(cleaned)
        }
    }
    return Array.from(normalized)
}

// Extract keywords from text content
export function extractKeywordsFromText(text: string): string[] {
    // Split into potential keyword phrases (1-4 words)
    const words = text.toLowerCase().split(/\s+/)
    const keywords: string[] = []

    // Extract 1-grams
    for (let i = 0; i < words.length; i++) {
        keywords.push(words[i])
    }

    // Extract 2-grams
    for (let i = 0; i < words.length - 1; i++) {
        keywords.push(`${words[i]} ${words[i + 1]}`)
    }

    // Extract 3-grams
    for (let i = 0; i < words.length - 2; i++) {
        keywords.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`)
    }

    return normalizeKeywords(keywords)
}

// Calculate keyword score based on multiple factors
export function calculateKeywordScore(data: RawKeywordData): number {
    // Frequency score (normalized)
    const freqScore = Math.min(data.frequency / 10, 1.0)

    // Position score (earlier = better)
    const posScore = 1.0 - Math.min(data.position / 100, 1.0)

    // Length score (2-3 words is ideal)
    const wordCount = data.term.split(' ').length
    const lengthScore = wordCount >= 2 && wordCount <= 3 ? 1.0 : 0.7

    // Weighted combination (as per spec)
    const score = 0.35 * freqScore + 0.25 * posScore + 0.20 * lengthScore + 0.20 * 0.8

    return Math.min(Math.max(score, 0), 1.0)
}

// Calculate similarity between two strings using trigram matching
function trigramSimilarity(str1: string, str2: string): number {
    const trigrams1 = new Set<string>()
    const trigrams2 = new Set<string>()

    // Generate trigrams
    for (let i = 0; i < str1.length - 2; i++) {
        trigrams1.add(str1.substring(i, i + 3))
    }
    for (let i = 0; i < str2.length - 2; i++) {
        trigrams2.add(str2.substring(i, i + 3))
    }

    // Calculate Jaccard similarity
    const intersection = new Set([...trigrams1].filter((x) => trigrams2.has(x)))
    const union = new Set([...trigrams1, ...trigrams2])

    return union.size > 0 ? intersection.size / union.size : 0
}

// Cluster keywords by semantic similarity
export function clusterKeywords(keywords: Keyword[], threshold = 0.5): Cluster[] {
    const clusters: Cluster[] = []
    const assigned = new Set<string>()

    // Sort by score (highest first)
    const sorted = [...keywords].sort((a, b) => b.score - a.score)

    for (const keyword of sorted) {
        if (assigned.has(keyword.term)) continue

        // Create new cluster
        const cluster: Cluster = {
            id: `c${clusters.length + 1}`,
            keywords: [keyword.term],
            primaryTerm: keyword.term,
            avgScore: keyword.score,
        }

        assigned.add(keyword.term)

        // Find similar keywords
        for (const other of sorted) {
            if (assigned.has(other.term)) continue

            const similarity = trigramSimilarity(keyword.term, other.term)
            if (similarity >= threshold) {
                cluster.keywords.push(other.term)
                cluster.avgScore =
                    (cluster.avgScore * (cluster.keywords.length - 1) + other.score) /
                    cluster.keywords.length
                assigned.add(other.term)
            }
        }

        clusters.push(cluster)
    }

    return clusters
}

// Classify keywords into primary/secondary/tertiary based on score
export function classifyKeywords(keywords: Keyword[]): Keyword[] {
    const sorted = [...keywords].sort((a, b) => b.score - a.score)
    const total = sorted.length

    return sorted.map((keyword, index) => {
        const percentile = index / total
        let classification: 'primary' | 'secondary' | 'tertiary'

        if (percentile < 0.2) {
            classification = 'primary'
        } else if (percentile < 0.5) {
            classification = 'secondary'
        } else {
            classification = 'tertiary'
        }

        return {
            ...keyword,
            class: classification,
        }
    })
}

// Generate keywords using AI (for seed expansion)
export async function expandSeedKeywords(
    seeds: string[],
    category: string,
    marketplace: string
): Promise<string[]> {
    const cacheKey = `keywords:expand:${seeds.join(',')}:${category}`
    const cached = await cache.get<string[]>(cacheKey)
    if (cached) return cached

    try {
        const prompt = `You are an Amazon SEO expert. Given these seed keywords for ${category} products in ${marketplace} marketplace, generate 30 highly relevant, specific keyword variations that real customers would search for. Focus on:
- Long-tail keywords (2-4 words)
- Natural search phrases
- Product features and benefits
- Use cases and applications

Seed keywords: ${seeds.join(', ')}

Return ONLY the keywords, one per line, no numbering or formatting.`

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content:
                        'You are an Amazon SEO keyword expert. Generate highly relevant search keywords.',
                },
                { role: 'user', content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 500,
        })

        const content = response.choices[0]?.message?.content || ''
        const keywords = content
            .split('\n')
            .map((line: string) => line.trim())
            .filter((line: string) => line.length > 0)

        const normalized = normalizeKeywords(keywords)
        await cache.set(cacheKey, normalized, 86400) // 24 hours

        return normalized
    } catch (error) {
        console.error('Error expanding seed keywords:', error)
        return seeds
    }
}

// Analyze competitor ASIN using DataForSEO Labs Amazon API
export async function analyzeCompetitorASIN(asin: string, marketplace = 'US'): Promise<RawKeywordData[]> {
    const cacheKey = `keywords:asin:${marketplace}:${asin}`
    const cached = await cache.get<RawKeywordData[]>(cacheKey)
    if (cached) return cached

    try {
        const { fetchRankedKeywords } = await import('../dataforseo')
        const rankedItems = await fetchRankedKeywords(asin, marketplace, 500)

        const data: RawKeywordData[] = rankedItems.map((item, index) => ({
            term: item.keyword_data.keyword,
            frequency: item.keyword_data.keyword_info?.search_volume || 0,
            position: item.ranked_serp_element?.serp_item?.rank_absolute || index + 1,
            source: asin,
        }))

        await cache.set(cacheKey, data, 3600) // 1 hour
        return data
    } catch (error) {
        console.error(`Failed to fetch ranked keywords for ${asin}:`, error)
        return []
    }
}

// Main keyword generation function
export async function generateKeywords(params: {
    marketplace: string
    asin_list?: string[]
    seeds?: string[]
    category?: string
}): Promise<Keyword[]> {
    const allRawKeywords: RawKeywordData[] = []

    // Analyze competitor ASINs using DataForSEO
    if (params.asin_list && params.asin_list.length > 0) {
        for (const asin of params.asin_list) {
            const data = await analyzeCompetitorASIN(asin, params.marketplace)
            allRawKeywords.push(...data)
        }
    }

    // Expand seed keywords
    if (params.seeds && params.seeds.length > 0) {
        const expanded = await expandSeedKeywords(
            params.seeds,
            params.category || 'General',
            params.marketplace
        )
        allRawKeywords.push(
            ...expanded.map((term, index) => ({
                term,
                frequency: 1,
                position: index,
                source: 'seed',
            }))
        )
    }

    // Calculate scores
    const keywords: Keyword[] = allRawKeywords.map((raw) => ({
        term: raw.term,
        score: calculateKeywordScore(raw),
        cluster_id: '',
        class: 'secondary' as const,
        source: raw.source === 'seed' ? 'seed' : ('competitor' as const),
    }))

    // Cluster keywords
    const clusters = clusterKeywords(keywords, 0.5)
    const keywordsWithClusters = keywords.map((keyword) => {
        const cluster = clusters.find((c) => c.keywords.includes(keyword.term))
        return {
            ...keyword,
            cluster_id: cluster?.id || '',
        }
    })

    // Classify keywords
    const classified = classifyKeywords(keywordsWithClusters)

    return classified
}
