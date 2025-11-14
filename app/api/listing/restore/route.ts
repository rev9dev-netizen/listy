import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/databse/prisma'
import { getOrCreateUser } from '@/lib/auth-helpers'

// POST: restore a version by creating a new head version copying its content
export async function POST(request: NextRequest) {
    try {
        const user = await getOrCreateUser()
        const body = await request.json() as { version?: number; id?: string }
        const { version, id } = body

        // Find source draft by id or version
        const sourceDraft = id
            ? await prisma.draft.findFirst({ where: { id, userId: user.id } })
            : version !== undefined
                ? await prisma.draft.findFirst({ where: { userId: user.id, version } })
                : null

        if (!sourceDraft) return NextResponse.json({ error: 'Source draft not found' }, { status: 404 })

        // Get latest version number for user
        const latestDraft = await prisma.draft.findFirst({
            where: { userId: user.id },
            orderBy: { version: 'desc' },
            select: { version: true }
        })
        const newVersion = (latestDraft?.version || 0) + 1

        const newDraft = await prisma.draft.create({
            data: {
                userId: user.id,
                title: sourceDraft.title,
                bullets: sourceDraft.bullets as unknown as object,
                description: sourceDraft.description,
                backendTerms: sourceDraft.backendTerms as unknown as string | null,
                keywords: sourceDraft.keywords as unknown as object,
                finalized: false,
                version: newVersion
            }
        })

        return NextResponse.json({ id: newDraft.id, version: newDraft.version })
    } catch (e) {
        console.error('Error restoring draft version', e)
        return NextResponse.json({ error: 'Failed to restore version' }, { status: 500 })
    }
}
