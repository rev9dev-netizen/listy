export type EnrichedKeyword = {
    phrase: string
    searchVolume: number | null
    cpc: number | null
    competition: number | null
    source: 'cache' | 'd4s'
    cachedAt: number | null
    marketplace: string
}

export async function lookupKeywords(phrases: string[], marketplace = 'US', provider: 'labs-amazon' | 'googleads' = 'labs-amazon') {
    const res = await fetch('/api/keywords/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrases, marketplace, provider }),
    })
    if (!res.ok) throw new Error('Keyword lookup failed')
    const data = (await res.json()) as { items: EnrichedKeyword[] }
    return data.items
}

// Convenience: enrich a local keyword list in-place without re-requesting already known metrics
export async function enrichKeywords(
    current: { phrase: string; searchVolume: number }[],
    marketplace = 'US',
    provider: 'labs-amazon' | 'googleads' = 'labs-amazon'
) {
    const missing = current
        .filter((k) => !k.searchVolume || k.searchVolume <= 0)
        .map((k) => k.phrase);
    if (missing.length === 0) return [] as EnrichedKeyword[];
    // De-dupe and cap
    const unique = Array.from(new Set(missing)).slice(0, 1000);
    return lookupKeywords(unique, marketplace, provider);
}
