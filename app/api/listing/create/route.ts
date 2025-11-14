import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/databse/prisma';

interface CreateListingRequest {
    marketplace?: string;
    asin?: string;
    mode: 'scratch' | 'fetch';
}

export async function POST(request: NextRequest) {
    try {
        const user = await getOrCreateUser();
        const body = (await request.json()) as CreateListingRequest;

        const marketplace = body.marketplace || 'US';

        // If fetch mode, we'll import from Amazon ASIN
        if (body.mode === 'fetch') {
            if (!body.asin) {
                return NextResponse.json({ error: 'ASIN is required for fetch mode' }, { status: 400 });
            }

            // Import listing from Amazon (this will be handled by the import endpoint)
            // For now, we'll just create a placeholder draft
            const draft = await prisma.draft.create({
                data: {
                    userId: user.id,
                    title: `Imported from ${body.asin}`,
                    bullets: ['Placeholder bullet 1', 'Placeholder bullet 2', 'Placeholder bullet 3', 'Placeholder bullet 4', 'Placeholder bullet 5'],
                    description: 'Imported listing content will appear here',
                    keywords: [],
                    finalized: false,
                    version: 1,
                },
            });

            return NextResponse.json({
                id: draft.id,
                marketplace,
                asin: body.asin,
            });
        }

        // For scratch mode, create an empty draft
        const draft = await prisma.draft.create({
            data: {
                userId: user.id,
                title: '',
                bullets: [],
                description: '',
                keywords: [],
                finalized: false,
                version: 1,
            },
        }); return NextResponse.json({
            id: draft.id,
            marketplace,
        });
    } catch (error) {
        console.error('Error creating listing:', error);
        return NextResponse.json(
            { error: 'Failed to create listing' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const user = await getOrCreateUser();

        // Get all listings (drafts) for the user
        const drafts = await prisma.draft.findMany({
            where: { userId: user.id },
            orderBy: { updatedAt: 'desc' },
            select: {
                id: true,
                title: true,
                version: true,
                finalized: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return NextResponse.json({ listings: drafts });
    } catch (error) {
        console.error('Error fetching listings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch listings' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const user = await getOrCreateUser();
        const draftId = request.nextUrl.searchParams.get('id');

        if (!draftId) {
            return NextResponse.json({ error: 'Draft ID is required' }, { status: 400 });
        }

        // Verify ownership and delete
        const draft = await prisma.draft.findFirst({
            where: { id: draftId, userId: user.id },
        });

        if (!draft) {
            return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
        }

        await prisma.draft.delete({
            where: { id: draftId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting listing:', error);
        return NextResponse.json(
            { error: 'Failed to delete listing' },
            { status: 500 }
        );
    }
}
