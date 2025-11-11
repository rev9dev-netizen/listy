import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateListingDraft } from '@/lib/services/listing-service'
import type { ListingDraftRequest } from '@/lib/types'

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = (await request.json()) as ListingDraftRequest

        // Validate request
        if (!body.marketplace || !body.brand || !body.product_type) {
            return NextResponse.json(
                { error: 'Marketplace, brand, and product_type are required' },
                { status: 400 }
            )
        }

        // Generate listing
        const draft = await generateListingDraft(body)

        // Store in database if projectId is provided
        const projectId = request.nextUrl.searchParams.get('projectId')
        if (projectId) {
            // Verify project ownership
            const project = await prisma.project.findFirst({
                where: {
                    id: projectId,
                    user: {
                        clerkId: userId,
                    },
                },
            })

            if (project) {
                // Get current version
                const lastDraft = await prisma.draft.findFirst({
                    where: { projectId },
                    orderBy: { version: 'desc' },
                })

                const newVersion = (lastDraft?.version || 0) + 1

                // Create new draft
                await prisma.draft.create({
                    data: {
                        projectId,
                        title: draft.title,
                        bullets: draft.bullets,
                        description: draft.description,
                        version: newVersion,
                    },
                })
            }
        }

        return NextResponse.json(draft)
    } catch (error) {
        console.error('Error generating listing:', error)
        return NextResponse.json({ error: 'Failed to generate listing' }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const projectId = request.nextUrl.searchParams.get('projectId')
        if (!projectId) {
            return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
        }

        // Verify project ownership and fetch latest draft
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                user: {
                    clerkId: userId,
                },
            },
            include: {
                drafts: {
                    orderBy: {
                        version: 'desc',
                    },
                    take: 1,
                },
            },
        })

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 })
        }

        if (project.drafts.length === 0) {
            return NextResponse.json({ error: 'No drafts found' }, { status: 404 })
        }

        const draft = project.drafts[0]
        return NextResponse.json({
            title: draft.title,
            bullets: draft.bullets,
            description: draft.description,
            version: draft.version,
            updatedAt: draft.updatedAt
        })
    } catch (error) {
        console.error('Error fetching draft:', error)
        return NextResponse.json({ error: 'Failed to fetch draft' }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const projectId = request.nextUrl.searchParams.get('projectId')
        if (!projectId) {
            return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
        }

        const body = (await request.json()) as {
            title?: string
            bullets?: string[]
            description?: string
            backendTerms?: string | null
        }

        // Verify ownership and get latest draft
        const project = await prisma.project.findFirst({
            where: { id: projectId, user: { clerkId: userId } },
            include: { drafts: { orderBy: { version: 'desc' }, take: 1 } },
        })
        if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

        if (project.drafts.length === 0) {
            // If no draft exists yet, create version 1
            const created = await prisma.draft.create({
                data: {
                    projectId,
                    title: body.title ?? '',
                    bullets: body.bullets ?? [],
                    description: body.description ?? '',
                    backendTerms: body.backendTerms ?? null,
                    version: 1,
                },
            })
            return NextResponse.json({ id: created.id, version: created.version })
        }

        const latest = project.drafts[0]
        const updated = await prisma.draft.update({
            where: { id: latest.id },
            data: {
                title: body.title ?? latest.title,
                bullets: (body.bullets ?? latest.bullets) as unknown as object,
                description: body.description ?? latest.description,
                backendTerms: (body.backendTerms ?? latest.backendTerms) as unknown as string | null,
            },
        })

        return NextResponse.json({ id: updated.id, version: updated.version })
    } catch (error) {
        console.error('Error updating draft:', error)
        return NextResponse.json({ error: 'Failed to update draft' }, { status: 500 })
    }
}
