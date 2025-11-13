const D4S_BASE = 'https://api.dataforseo.com/v3'
const D4S_LABS = 'https://api.dataforseo.com/v3/dataforseo_labs'

function authHeader() {
    const u = process.env.DATAFORSEO_LOGIN
    const p = process.env.DATAFORSEO_PASSWORD
    if (!u || !p) {
        console.error('DataForSEO credentials missing:', {
            hasLogin: !!u,
            hasPassword: !!p,
            login: u ? `${u.substring(0, 3)}...` : 'undefined'
        })
        throw new Error('DATAFORSEO_LOGIN/DATAFORSEO_PASSWORD not set in environment')
    }
    const auth = 'Basic ' + Buffer.from(`${u}:${p}`).toString('base64')
    console.log('DataForSEO auth header created for user:', u)
    return auth
}

export type VolumeItem = {
    keyword: string
    keyword_info?: {
        search_volume?: number
        cpc?: number
        competition?: number
        last_update_time?: string
        monthly_searches?: { year: number; month: number; search_volume: number }[]
    }
}

export type VolumeResult = Record<string, {
    searchVolume: number | null
    cpc: number | null
    competition: number | null
    lastUpdated?: string
    source: 'd4s'
}>

export function resolveLocationAndLanguage(marketplace?: string) {
    switch ((marketplace || 'US').toUpperCase()) {
        case 'US': return { location_code: 2840, language_code: 'en' }
        case 'UK':
        case 'GB': return { location_code: 2826, language_code: 'en' }
        case 'CA': return { location_code: 2124, language_code: 'en' }
        case 'AU': return { location_code: 2036, language_code: 'en' }
        case 'DE': return { location_code: 2276, language_code: 'de' }
        case 'FR': return { location_code: 2250, language_code: 'fr' }
        case 'IT': return { location_code: 2380, language_code: 'it' }
        case 'ES': return { location_code: 2248, language_code: 'es' }
        case 'IN': return { location_code: 2356, language_code: 'en' }
        case 'JP': return { location_code: 2392, language_code: 'ja' }
        case 'MX': return { location_code: 2484, language_code: 'es' }
        default: return { location_code: 2840, language_code: 'en' }
    }
}

// ========== Google Ads (existing) ==========
async function postTask(keywords: string[], opts: { location_code: number; language_code: string }) {
    const r = await fetch(`${D4S_BASE}/keywords_data/google_ads/search_volume/task_post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader() },
        body: JSON.stringify([{ ...opts, keywords }]),
        cache: 'no-store',
    })
    if (!r.ok) throw new Error(`DataForSEO task_post failed: ${r.status}`)
    const j = await r.json()
    const id = j?.tasks?.[0]?.id
    if (!id) throw new Error('No task id from DataForSEO')
    return id as string
}

async function getTask(id: string) {
    for (let i = 0; i < 24; i++) {
        const r = await fetch(`${D4S_BASE}/keywords_data/google_ads/search_volume/task_get/${id}`, {
            headers: { Authorization: authHeader() },
            cache: 'no-store',
        })
        if (!r.ok) throw new Error(`DataForSEO task_get failed: ${r.status}`)
        const j = await r.json()
        const items: VolumeItem[] | undefined = j?.tasks?.[0]?.result?.[0]?.items
        if (Array.isArray(items)) return items
        await new Promise(res => setTimeout(res, 800))
    }
    throw new Error('Timed out waiting for DataForSEO result')
}

export async function fetchVolumes(keywords: string[], marketplace?: string): Promise<VolumeResult> {
    const { location_code, language_code } = resolveLocationAndLanguage(marketplace)
    const taskId = await postTask(keywords, { location_code, language_code })
    const items = await getTask(taskId)
    const out: VolumeResult = {}
    for (const it of items) {
        out[it.keyword] = {
            searchVolume: it.keyword_info?.search_volume ?? null,
            cpc: it.keyword_info?.cpc ?? null,
            competition: it.keyword_info?.competition ?? null,
            lastUpdated: it.keyword_info?.last_update_time,
            source: 'd4s',
        }
    }
    for (const k of keywords) if (!out[k]) out[k] = { searchVolume: null, cpc: null, competition: null, source: 'd4s' }
    return out
}

// ========== DataForSEO Labs: Amazon Bulk Search Volume (live) ==========
function amazonDomain(market: string) {
    switch (market.toUpperCase()) {
        case 'US': return 'amazon.com'
        case 'UK':
        case 'GB': return 'amazon.co.uk'
        case 'CA': return 'amazon.ca'
        case 'DE': return 'amazon.de'
        case 'FR': return 'amazon.fr'
        case 'IT': return 'amazon.it'
        case 'ES': return 'amazon.es'
        case 'JP': return 'amazon.co.jp'
        case 'MX': return 'amazon.com.mx'
        case 'IN': return 'amazon.in'
        case 'AU': return 'amazon.com.au'
        default: return 'amazon.com'
    }
}

export type AmazonBulkVolumeItem = {
    keyword: string
    search_volume?: number
}

export async function fetchAmazonBulkVolumes(keywords: string[], marketplace = 'US'): Promise<VolumeResult> {
    if (!Array.isArray(keywords) || keywords.length === 0) return {}
    const domain = amazonDomain(marketplace || 'US')
    const r = await fetch(`${D4S_LABS}/amazon/bulk_search_volume/live`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader() },
        body: JSON.stringify([
            {
                keywords,
                amazon_domain: domain,
            },
        ]),
        cache: 'no-store',
    })
    if (!r.ok) throw new Error(`Labs bulk_search_volume failed: ${r.status}`)
    const j = await r.json()
    const items: AmazonBulkVolumeItem[] | undefined = j?.tasks?.[0]?.result?.[0]?.items
    const out: VolumeResult = {}
    for (const k of keywords) out[k] = { searchVolume: null, cpc: null, competition: null, source: 'd4s' }
    if (Array.isArray(items)) {
        for (const it of items) {
            out[it.keyword] = {
                searchVolume: it.search_volume ?? null,
                cpc: null,
                competition: null,
                source: 'd4s',
            }
        }
    }
    return out
}

// ========== Ranked Keywords (reverse ASIN lookup) ==========
export type RankedKeywordItem = {
    keyword_data: {
        keyword: string
        keyword_info?: {
            search_volume?: number
            monthly_searches?: Array<{
                year: number
                month: number
                search_volume: number
            }>
        }
    }
    ranked_serp_element: {
        serp_item?: {
            type?: string
            rank_group?: number
            rank_absolute?: number
            position?: string
            xpath?: string
            domain?: string
            title?: string
            url?: string
            breadcrumb?: string
            is_paid?: boolean
            rating?: {
                rating_type?: string
                value?: number
                votes_count?: number
                rating_max?: number
            }
            price?: {
                current?: number
                regular?: number
                max_value?: number
                currency?: string
                is_price_range?: boolean
                displayed_price?: string
            }
        }
    }
    metrics?: {
        organic_etv?: number
        paid_etv?: number
        impressions_etv?: number
        estimated_paid_traffic_cost?: number
        rank_changes?: {
            previous_rank_absolute?: number
            rank_absolute_change?: number
            is_new?: boolean
            is_up?: boolean
            is_down?: boolean
            is_lost?: boolean
        }
    }
}

export async function fetchRankedKeywords(asin: string, marketplace = 'US', limit = 100) {
    const { location_code, language_code } = resolveLocationAndLanguage(marketplace)
    const url = `${D4S_LABS}/amazon/ranked_keywords/live`
    const payload = [
        {
            asin,
            location_code,
            language_code,
            ignore_synonyms: false,
            limit,
        },
    ]

    console.log('Fetching ranked keywords:', { asin, marketplace, location_code, url })

    const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader() },
        body: JSON.stringify(payload),
        cache: 'no-store',
    })

    if (!r.ok) {
        const errorText = await r.text()
        console.error('DataForSEO ranked_keywords error:', {
            status: r.status,
            statusText: r.statusText,
            body: errorText.substring(0, 500)
        })
        throw new Error(`ranked_keywords failed: ${r.status} ${r.statusText}`)
    }

    const j = await r.json()
    console.log('DataForSEO full response:', JSON.stringify(j, null, 2).substring(0, 1000))

    const task = j?.tasks?.[0]
    if (!task) {
        console.error('No task in response:', j)
        return []
    }

    if (task.status_code !== 20000) {
        console.error('Task failed:', {
            status_code: task.status_code,
            status_message: task.status_message,
        })
        return []
    }

    const result = task.result?.[0]
    if (!result) {
        console.error('No result in task:', task)
        return []
    }

    const items: RankedKeywordItem[] = result.items || []
    console.log('Ranked keywords fetched:', {
        count: items.length,
        totalCount: result.total_count,
        sampleKeywords: items.slice(0, 3).map((i: RankedKeywordItem) => i.keyword_data?.keyword)
    })

    return items
}

// ========== Product Competitors ==========
export type ProductCompetitorItem = {
    asin: string
    title?: string
    avg_position?: number
    median_position?: number
}

export async function fetchProductCompetitors(asin: string, marketplace = 'US', limit = 100) {
    const { location_code, language_code } = resolveLocationAndLanguage(marketplace)
    const r = await fetch(`${D4S_LABS}/amazon/product_competitors/live`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader() },
        body: JSON.stringify([
            {
                asin,
                location_code,
                language_code,
                limit,
            },
        ]),
        cache: 'no-store',
    })
    if (!r.ok) throw new Error(`product_competitors failed: ${r.status}`)
    const j = await r.json()
    const items: ProductCompetitorItem[] | undefined = j?.tasks?.[0]?.result?.[0]?.items
    return items || []
}

// ========== Keyword Intersections ==========
export type KeywordIntersectionItem = {
    keyword_data: {
        keyword: string
        keyword_info?: {
            search_volume?: number
            last_updated_time?: string
        }
    }
    intersection_result: Record<string, {
        se_type?: string
        type?: string
        rank_group?: number
        rank_absolute?: number
        position?: string
        xpath?: string
        domain?: string
        title?: string
        url?: string
        asin?: string
        image_url?: string
        price_from?: number
        price_to?: number
        currency?: string
        is_paid?: boolean
        is_best_seller?: boolean
        is_amazon_choice?: boolean
        rating?: {
            rating_type?: string
            value?: number
            votes_count?: number
            rating_max?: number
        }
    }>
}

export async function fetchKeywordIntersections(asins: string[], marketplace = 'US', limit = 100, mode: 'union' | 'intersect' = 'intersect') {
    const { location_code, language_code } = resolveLocationAndLanguage(marketplace)
    const asinObj: Record<string, string> = {}
    asins.forEach((a, i) => { asinObj[String(i + 1)] = a })
    const r = await fetch(`${D4S_LABS}/amazon/product_keyword_intersections/live`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader() },
        body: JSON.stringify([
            {
                asins: asinObj,
                location_code,
                language_code,
                intersection_mode: mode,
                limit,
            },
        ]),
        cache: 'no-store',
    })
    if (!r.ok) throw new Error(`keyword_intersections failed: ${r.status}`)
    const j = await r.json()
    const items: KeywordIntersectionItem[] | undefined = j?.tasks?.[0]?.result?.[0]?.items
    return items || []
}

// ========== Related Keywords ==========
export type RelatedKeywordItem = {
    keyword_data: {
        keyword: string
        search_volume?: number
    }
}

export async function fetchRelatedKeywords(keyword: string, marketplace = 'US', limit = 100, depth = 3) {
    const { location_code, language_code } = resolveLocationAndLanguage(marketplace)
    const r = await fetch(`${D4S_LABS}/amazon/related_keywords/live`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader() },
        body: JSON.stringify([
            {
                keyword,
                location_code,
                language_code,
                depth,
                include_seed_keyword: false,
                ignore_synonyms: false,
                limit,
            },
        ]),
        cache: 'no-store',
    })
    if (!r.ok) throw new Error(`related_keywords failed: ${r.status}`)
    const j = await r.json()
    const items: RelatedKeywordItem[] | undefined = j?.tasks?.[0]?.result?.[0]?.items
    return items || []
}
