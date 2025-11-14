import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/databse/prisma'

// GET: list all versions
export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const projectId = request.nextUrl.searchParams.get('projectId')
        if (!projectId) return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })

        const project = await prisma.project.findFirst({
            where: { id: projectId, user: { clerkId: userId } },
            include: { drafts: { orderBy: { version: 'desc' } } }
        })
        if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

        return NextResponse.json({
            versions: project.drafts.map((d: { id: string; version: number; updatedAt: Date; createdAt: Date }) => ({
                id: d.id,
                version: d.version,
                updatedAt: d.updatedAt,
                createdAt: d.createdAt
            }))
        })
    } catch (e) {
        console.error('Error listing versions', e)
        return NextResponse.json({ error: 'Failed to list versions' }, { status: 500 })
    }
}

// POST: fetch a specific version content (version or id)
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const body = await request.json() as { projectId: string; version?: number; id?: string }
        const { projectId, version, id } = body
        if (!projectId) return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })

        const whereDraft = id ? { id } : version ? { projectId_version: { projectId, version } } : null
        if (!whereDraft) return NextResponse.json({ error: 'Provide id or version' }, { status: 400 })

        const draft = await prisma.draft.findFirst({
            where: id ? { id, project: { user: { clerkId: userId } } } : { projectId, version, project: { user: { clerkId: userId } } }
        })

        if (!draft) return NextResponse.json({ error: 'Draft version not found' }, { status: 404 })

        return NextResponse.json({
            id: draft.id,
            version: draft.version,
            title: draft.title,
            bullets: draft.bullets,
            description: draft.description,
            backendTerms: draft.backendTerms
        })
    } catch (e) {
        console.error('Error fetching version', e)
        return NextResponse.json({ error: 'Failed to fetch version' }, { status: 500 })
    }
}
