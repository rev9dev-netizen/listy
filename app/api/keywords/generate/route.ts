import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateKeywords } from '@/lib/services/keyword-service'
import type { KeywordGenerationRequest } from '@/lib/types'

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = (await request.json()) as KeywordGenerationRequest

        // Validate request
        if (!body.marketplace) {
            return NextResponse.json({ error: 'Marketplace is required' }, { status: 400 })
        }

        // Generate keywords
        const keywords = await generateKeywords({
            marketplace: body.marketplace,
            asin_list: body.asin_list,
            seeds: body.seeds,
            category: body.category,
        })

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
                // Delete existing keywords for this project
                await prisma.keyword.deleteMany({
                    where: { projectId },
                })

                // Insert new keywords
                await prisma.keyword.createMany({
                    data: keywords.map((k) => ({
                        projectId,
                        term: k.term,
                        score: k.score,
                        clusterId: k.cluster_id,
                        class: k.class,
                        source: k.source,
                        included: true,
                    })),
                })
            }
        }

        return NextResponse.json({ keywords })
    } catch (error) {
        console.error('Error generating keywords:', error)
        return NextResponse.json({ error: 'Failed to generate keywords' }, { status: 500 })
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

        // Verify project ownership and fetch keywords
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                user: {
                    clerkId: userId,
                },
            },
            include: {
                keywords: {
                    orderBy: {
                        score: 'desc',
                    },
                },
            },
        })

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 })
        }

        const keywords = project.keywords.map((k: {
            term: string
            score: number
            clusterId: string | null
            class: string
            source: string
            included: boolean
        }) => ({
            term: k.term,
            score: k.score,
            cluster_id: k.clusterId || '',
            class: k.class,
            source: k.source,
            included: k.included,
        }))

        return NextResponse.json({ keywords })
    } catch (error) {
        console.error('Error fetching keywords:', error)
        return NextResponse.json({ error: 'Failed to fetch keywords' }, { status: 500 })
    }
}
