import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/databse/prisma'
import { computeDraftHash } from '@/lib/utils'
import { getOrCreateUser } from '@/lib/auth-helpers'

// POST: finalize the current listing by creating a new version snapshot
export async function POST(request: NextRequest) {
    try {
        const user = await getOrCreateUser()

        const body = await request.json() as {
            draftId?: string
            title: string
            bullets: string[]
            description: string
            backendTerms?: string | null
            keywords?: Array<{
                phrase: string
                searchVolume: number
                sales: number
                cps: number | null
                selected: boolean
            }>
        }

        const { draftId, title, bullets, description, backendTerms, keywords } = body

        // Get latest finalized snapshot for this user
        const lastFinal = await prisma.draft.findFirst({
            where: { userId: user.id, finalized: true },
            orderBy: { version: 'desc' },
            select: { id: true, version: true, keywords: true, contentHash: true }
        })
        const newVersion = (lastFinal?.version ?? 0) + 1
        // If keywords not passed, inherit from latest finalized draft (if any)
        const inheritedKeywords = (keywords && keywords.length > 0)
            ? keywords
            : (lastFinal?.keywords ?? [])

        // Compute hash and dedupe against latest finalized version
        const contentHash = await computeDraftHash({ title, bullets, description, backendTerms: backendTerms ?? null, keywords: inheritedKeywords })
        if (lastFinal?.contentHash === contentHash) {
            return NextResponse.json({ id: lastFinal.id, version: lastFinal.version })
        }

        // If draftId provided, update existing draft, otherwise create new
        let draft
        if (draftId) {
            // Verify ownership before updating
            const existing = await prisma.draft.findFirst({
                where: { id: draftId, userId: user.id }
            })
            if (!existing) {
                return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
            }

            draft = await prisma.draft.update({
                where: { id: draftId },
                data: {
                    title,
                    bullets: bullets as unknown as object,
                    description,
                    backendTerms: (backendTerms ?? null) as unknown as string | null,
                    keywords: inheritedKeywords as unknown as object,
                    finalized: true,
                    contentHash,
                    version: newVersion
                }
            })
        } else {
            draft = await prisma.draft.create({
                data: {
                    userId: user.id,
                    title,
                    bullets: bullets as unknown as object,
                    description,
                    backendTerms: (backendTerms ?? null) as unknown as string | null,
                    keywords: inheritedKeywords as unknown as object,
                    finalized: true,
                    contentHash,
                    version: newVersion
                }
            })
        }

        return NextResponse.json({ id: draft.id, version: draft.version })
    } catch (e) {
        console.error('Error finalizing listing', e)
        return NextResponse.json({ error: 'Failed to finalize listing' }, { status: 500 })
    }
}
