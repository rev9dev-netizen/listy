import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/databse/prisma'

// POST: restore a version by creating a new head version copying its content
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const body = await request.json() as { projectId: string; version?: number; id?: string }
        const { projectId, version, id } = body
        if (!projectId) return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })

        const project = await prisma.project.findFirst({
            where: { id: projectId, user: { clerkId: userId } },
            include: { drafts: { orderBy: { version: 'desc' } } }
        })
        if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

        const sourceDraft = id
            ? await prisma.draft.findFirst({ where: { id, projectId } })
            : version
                ? await prisma.draft.findFirst({ where: { projectId, version } })
                : null

        if (!sourceDraft) return NextResponse.json({ error: 'Source draft not found' }, { status: 404 })

        const newVersion = (project.drafts[0]?.version || 0) + 1

        const newDraft = await prisma.draft.create({
            data: {
                projectId,
                title: sourceDraft.title,
                bullets: sourceDraft.bullets as unknown as object,
                description: sourceDraft.description,
                backendTerms: sourceDraft.backendTerms as unknown as string | null,
                version: newVersion
            }
        })

        return NextResponse.json({ id: newDraft.id, version: newDraft.version })
    } catch (e) {
        console.error('Error restoring draft version', e)
        return NextResponse.json({ error: 'Failed to restore version' }, { status: 500 })
    }
}
