import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'node:crypto'

// Simple stable JSON stringify for hashing
function stableStringify(obj: unknown) {
    if (obj === null) return 'null'
    if (typeof obj !== 'object') return JSON.stringify(obj)
    return JSON.stringify(obj, Object.keys(obj as Record<string, unknown>).sort())
}

function sha256(data: string) {
    return crypto.createHash('sha256').update(data).digest('hex')
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json() as { projectId: string; asin: string; marketplace?: string }
        const { projectId, asin } = body
        if (!projectId || !asin) {
            return NextResponse.json({ error: 'projectId and asin are required' }, { status: 400 })
        }

        // Verify project exists
        const project = await prisma.project.findUnique({ where: { id: projectId } })
        if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

        const apiKey = process.env.SERPAPI_KEY
        if (!apiKey) {
            return NextResponse.json({ error: 'SERPAPI_KEY not configured' }, { status: 500 })
        }

        // Call SerpApi Amazon product endpoint
        const url = new URL('https://serpapi.com/search.json')
        url.searchParams.set('engine', 'amazon_product')
        url.searchParams.set('amazon_domain', domainForMarketplace(project.marketplace || 'US'))
        url.searchParams.set('asin', asin)
        url.searchParams.set('api_key', apiKey)

        const res = await fetch(url.toString(), { cache: 'no-store' })
        if (!res.ok) {
            const text = await res.text()
            return NextResponse.json({ error: `SerpApi error: ${res.status} ${text}` }, { status: 502 })
        }
        const data = await res.json()

        // Parse minimal fields
        const title: string = data.title || data.product_title || ''
        const bullets: string[] = extractBullets(data)
        const description: string = extractDescription(data)

        if (!title && bullets.length === 0 && !description) {
            return NextResponse.json({ error: 'No listing content found for this ASIN' }, { status: 404 })
        }

        // Compute content hash to dedupe
        const contentHash = sha256(stableStringify({ title, bullets, description }))

        // Check latest finalized to avoid duplicates
        const lastFinal = await prisma.draft.findFirst({
            where: { projectId, finalized: true },
            orderBy: { version: 'desc' },
            select: { id: true, version: true, contentHash: true }
        })

        if (lastFinal && lastFinal.contentHash === contentHash) {
            return NextResponse.json({ id: lastFinal.id, version: lastFinal.version, reused: true })
        }

        const nextVersion = (lastFinal?.version ?? 0) + 1

        const draft = await prisma.draft.create({
            data: {
                projectId,
                title: title || '',
                bullets,
                description: description || '',
                backendTerms: '',
                keywords: [],
                finalized: true,
                contentHash,
                version: nextVersion,
            }
        })

        return NextResponse.json({ id: draft.id, version: draft.version })
    } catch (err) {
        console.error('Import listing failed', err)
        return NextResponse.json({ error: 'Failed to import listing' }, { status: 500 })
    }
}

function domainForMarketplace(code: string) {
    switch ((code || 'US').toUpperCase()) {
        case 'US': return 'amazon.com'
        case 'UK': return 'amazon.co.uk'
        case 'CA': return 'amazon.ca'
        case 'DE': return 'amazon.de'
        case 'FR': return 'amazon.fr'
        case 'IT': return 'amazon.it'
        case 'ES': return 'amazon.es'
        case 'JP': return 'amazon.co.jp'
        default: return 'amazon.com'
    }
}

function extractBullets(data: unknown): string[] {
    if (!data || typeof data !== 'object') return []
    const d = data as Record<string, unknown>
    const bullets: string[] = []
    if (Array.isArray(d.features)) {
        for (const f of d.features) if (typeof f === 'string') bullets.push(f)
    }
    if (bullets.length === 0 && Array.isArray(d.bullets)) {
        for (const f of d.bullets) if (typeof f === 'string') bullets.push(f)
    }
    return bullets.slice(0, 5)
}

function extractDescription(data: unknown): string {
    if (!data || typeof data !== 'object') return ''
    const d = data as Record<string, unknown>
    if (typeof d.product_description === 'string') return d.product_description
    if (typeof d.description === 'string') return d.description
    if (Array.isArray(d.product_description)) return d.product_description.filter(x => typeof x === 'string').join('\n')
    return ''
}
