import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/databse/prisma'
import { computeDraftHash } from '@/lib/utils'

// POST: finalize the current listing by creating a new version snapshot
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json() as {
            projectId: string
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

        const { projectId, title, bullets, description, backendTerms, keywords } = body
        if (!projectId) return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })

        const project = await prisma.project.findFirst({
            where: { id: projectId, user: { clerkId: userId } },
            include: {
                drafts: {
                    orderBy: { version: 'desc' },
                    take: 1,
                    select: { id: true, version: true, keywords: true }
                }
            }
        })
        if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

        // Get latest finalized snapshot (not the editing draft)
        const lastFinal = await prisma.draft.findFirst({
            where: { projectId, finalized: true },
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
        const draft = await prisma.draft.create({
            data: {
                projectId,
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

        return NextResponse.json({ id: draft.id, version: draft.version })
    } catch (e) {
        console.error('Error finalizing listing', e)
        return NextResponse.json({ error: 'Failed to finalize listing' }, { status: 500 })
    }
}
