import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
        }

        const { projectId, title, bullets, description, backendTerms } = body
        if (!projectId) return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })

        const project = await prisma.project.findFirst({
            where: { id: projectId, user: { clerkId: userId } },
            include: { drafts: { orderBy: { version: 'desc' }, take: 1 } }
        })
        if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

        const newVersion = (project.drafts[0]?.version || 0) + 1
        const draft = await prisma.draft.create({
            data: {
                projectId,
                title,
                bullets: bullets as unknown as object,
                description,
                backendTerms: (backendTerms ?? null) as unknown as string | null,
                version: newVersion
            }
        })

        return NextResponse.json({ id: draft.id, version: draft.version })
    } catch (e) {
        console.error('Error finalizing listing', e)
        return NextResponse.json({ error: 'Failed to finalize listing' }, { status: 500 })
    }
}
