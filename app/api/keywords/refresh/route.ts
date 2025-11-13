import { NextRequest, NextResponse } from 'next/server'
import { cache } from '@/lib/redis'
import { fetchVolumes, fetchAmazonBulkVolumes } from '@/lib/dataforseo'

const TTL = Number(process.env.KEYWORD_CACHE_TTL_SECONDS || 60 * 60 * 24 * 7)

function key(mkt: string, phrase: string) {
    return `kw:v1:${mkt.toUpperCase()}:${phrase.toLowerCase()}`
}

export async function POST(req: NextRequest) {
    try {
        const { phrases, marketplace = 'US', provider = 'labs-amazon' } = (await req.json()) as { phrases: string[]; marketplace?: string; provider?: 'googleads' | 'labs-amazon' }
        if (!Array.isArray(phrases) || phrases.length === 0) return NextResponse.json({ updated: 0 })

        const unique = Array.from(new Set(phrases.map(p => p.trim()))).filter(Boolean)
        const chunkSize = 100
        let updated = 0
        for (let i = 0; i < unique.length; i += chunkSize) {
            const chunk = unique.slice(i, i + chunkSize)
            const res = provider === 'googleads'
                ? await fetchVolumes(chunk, marketplace)
                : await fetchAmazonBulkVolumes(chunk, marketplace)
            for (const [k, v] of Object.entries(res)) {
                await cache.set(key(marketplace, k), { ...v, cachedAt: Date.now(), marketplace, provider }, TTL)
                updated++
            }
        }

        return NextResponse.json({ updated, marketplace })
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to refresh keywords'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
