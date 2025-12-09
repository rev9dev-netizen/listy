import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/databse/prisma'
import { getOrCreateUser } from '@/lib/auth-helpers'

// GET: list all versions for user
export async function GET(request: NextRequest) {
    try {
        const user = await getOrCreateUser()
        const draftId = request.nextUrl.searchParams.get('draftId')

        // If draftId provided, get versions related to that specific listing
        // Otherwise get all user's draft versions
        const drafts = await prisma.draft.findMany({
            where: draftId
                ? { id: draftId, userId: user.id }
                : { userId: user.id },
            orderBy: { version: 'desc' },
            select: {
                id: true,
                version: true,
                title: true,
                finalized: true,
                updatedAt: true,
                createdAt: true
            }
        })

        return NextResponse.json({
            versions: drafts.map((d: typeof drafts[0]) => ({
                id: d.id,
                version: d.version,
                title: d.title,
                finalized: d.finalized,
                updatedAt: d.updatedAt,
                createdAt: d.createdAt
            }))
        })
    } catch (e) {
        console.error('Error listing versions', e)
        return NextResponse.json({ error: 'Failed to list versions' }, { status: 500 })
    }
}

// POST: fetch a specific version content (version number or id)
export async function POST(request: NextRequest) {
    try {
        const user = await getOrCreateUser()
        const body = await request.json() as { version?: number; id?: string }
        const { version, id } = body

        if (!id && version === undefined) {
            return NextResponse.json({ error: 'Provide id or version' }, { status: 400 })
        }

        const draft = await prisma.draft.findFirst({
            where: id
                ? { id, userId: user.id }
                : { userId: user.id, version }
        })

        if (!draft) return NextResponse.json({ error: 'Draft version not found' }, { status: 404 })

        return NextResponse.json({
            id: draft.id,
            version: draft.version,
            title: draft.title,
            bullets: draft.bullets,
            description: draft.description,
            backendTerms: draft.backendTerms,
            keywords: draft.keywords,
            finalized: draft.finalized
        })
    } catch (e) {
        console.error('Error fetching version', e)
        return NextResponse.json({ error: 'Failed to fetch version' }, { status: 500 })
    }
}
