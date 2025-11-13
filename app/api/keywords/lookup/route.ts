import { NextRequest, NextResponse } from 'next/server'
import { cache } from '@/lib/redis'
import { fetchVolumes, fetchAmazonBulkVolumes } from '@/lib/dataforseo'

type Req = { phrases: string[]; marketplace?: string; force?: boolean; provider?: 'googleads' | 'labs-amazon' }
type Metric = { searchVolume: number | null; cpc: number | null; competition: number | null; lastUpdated?: string; cachedAt?: number; marketplace?: string; source?: 'cache' | 'd4s' }

const TTL = Number(process.env.KEYWORD_CACHE_TTL_SECONDS || 60 * 60 * 24 * 7) // 7d

function key(mkt: string, phrase: string, provider: string) {
    return `kw:v1:${provider}:${mkt.toUpperCase()}:${phrase.toLowerCase()}`
}

export async function POST(req: NextRequest) {
    try {
        const { phrases, marketplace = 'US', force = false, provider = 'labs-amazon' } = (await req.json()) as Req
        if (!phrases?.length) return NextResponse.json({ items: [] })

        const unique = Array.from(new Set(phrases.map(p => p.trim()))).filter(Boolean).slice(0, 1000)

        const cached: Record<string, Metric> = {}
        const missing: string[] = []
        for (const p of unique) {
            if (!force) {
                const v = await cache.get<Metric>(key(marketplace, p, provider))
                if (v) { cached[p] = { ...v, source: 'cache' }; continue }
            }
            missing.push(p)
        }

        const fetched: Record<string, Metric> = {}
        const chunkSize = 100
        for (let i = 0; i < missing.length; i += chunkSize) {
            const chunk = missing.slice(i, i + chunkSize)
            if (!chunk.length) continue
            const res = provider === 'googleads'
                ? await fetchVolumes(chunk, marketplace)
                : await fetchAmazonBulkVolumes(chunk, marketplace)
            for (const [k, v] of Object.entries(res)) {
                fetched[k] = v
                await cache.set(key(marketplace, k, provider), { ...v, cachedAt: Date.now(), marketplace, provider }, TTL)
            }
        }

        const items = unique.map(p => {
            const d = cached[p] || fetched[p] || null
            return {
                phrase: p,
                searchVolume: d?.searchVolume ?? null,
                cpc: d?.cpc ?? null,
                competition: d?.competition ?? null,
                source: d?.source ?? (missing.includes(p) ? 'd4s' : 'cache'),
                cachedAt: d?.cachedAt ?? null,
                marketplace,
            }
        })

        return NextResponse.json({ items })
    } catch (e: unknown) {
        console.error('lookup failed', e)
        const msg = e instanceof Error ? e.message : 'Failed to lookup keywords'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
