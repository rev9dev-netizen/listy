import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = (await request.json()) as {
            marketplace: string
            brand?: string
            productType?: string
        }

        // Ensure user exists in database
        let user = await prisma.user.findUnique({
            where: { clerkId: userId },
        })

        if (!user) {
            // Create user if doesn't exist
            const clerkUser = await auth()
            user = await prisma.user.create({
                data: {
                    clerkId: userId,
                    email: clerkUser.sessionClaims?.email as string || 'unknown@example.com',
                },
            })
        }

        // Create project
        const project = await prisma.project.create({
            data: {
                userId: user.id,
                marketplace: body.marketplace || 'US',
                brand: body.brand,
                productType: body.productType,
            },
        })

        // Create default constraints
        await prisma.constraint.create({
            data: {
                projectId: project.id,
                titleLimit: 180,
                bulletLimit: 220,
                descLimit: 1500,
                disallowed: [],
                locale: 'en-US',
            },
        })

        return NextResponse.json(project)
    } catch (error) {
        console.error('Error creating project:', error)
        return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
    }
}

export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            include: {
                projects: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
            },
        })

        if (!user) {
            return NextResponse.json({ projects: [] })
        }

        return NextResponse.json({ projects: user.projects })
    } catch (error) {
        console.error('Error fetching projects:', error)
        return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }
}
