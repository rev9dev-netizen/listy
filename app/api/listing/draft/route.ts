/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/databse/prisma'
import { generateAmazonListing } from '@/lib/services/ai-listing-service'
import { getOrCreateUser } from '@/lib/auth-helpers'
import { LISTING_TEMPLATES, getTemplate } from '@/lib/listing-templates'

interface GenerateListingRequest {
    productName: string;
    brand?: string;
    category: string;
    keywords: Array<{
        phrase: string;
        searchVolume?: number;
        selected: boolean;
    }>;
    features?: string[];
    benefits?: string[];
    targetAudience?: string;
    uniqueSellingPoints?: string[];
    templateId?: string;
    marketplace?: string;
    section?: 'title' | 'bullets' | 'description' | 'all';
}

export async function POST(request: NextRequest) {
    try {
        const user = await getOrCreateUser()
        const body = (await request.json()) as GenerateListingRequest

        // Validate request
        if (!body.productName || !body.category) {
            return NextResponse.json(
                { error: 'Product name and category are required' },
                { status: 400 }
            )
        }

        if (!body.keywords || body.keywords.filter(k => k.selected).length === 0) {
            return NextResponse.json(
                { error: 'At least one keyword must be selected' },
                { status: 400 }
            )
        }

        // Load template if specified
        let template: any = getTemplate('professional-seo'); // Default
        if (body.templateId) {
            // Check if it's a system template
            const systemTemplate = LISTING_TEMPLATES.find(t => t.id === body.templateId);
            if (systemTemplate) {
                template = systemTemplate;
            } else {
                // Try to load custom template from database
                const customTemplate = await prisma.listingTemplate.findFirst({
                    where: { id: body.templateId, userId: user.id },
                });
                if (customTemplate) {
                    template = customTemplate;
                }
            }
        }

        // Generate listing with AI
        const generated = await generateAmazonListing(body, template)

        // If generating a specific section only, return just the content (don't save)
        if (body.section && body.section !== 'all') {
            return NextResponse.json({
                title: generated.title,
                bullets: generated.bullets,
                description: generated.description,
                warnings: generated.warnings,
                keywordUsage: generated.keywordUsage,
            })
        }

        // For 'all' or no section specified, create a full draft
        const lastDraft = await prisma.draft.findFirst({
            where: { userId: user.id },
            orderBy: { version: 'desc' },
        })

        const newVersion = (lastDraft?.version || 0) + 1

        // Create new draft linked to user
        const created = await prisma.draft.create({
            data: {
                userId: user.id,
                title: generated.title,
                bullets: generated.bullets as any,
                description: generated.description,
                backendTerms: generated.backendTerms,
                keywords: body.keywords as any,
                finalized: false,
                version: newVersion,
                // Persist inputs
                productName: body.productName,
                brand: body.brand,
                targetAudience: body.targetAudience,
                features: body.features || [],
            },
        })

        return NextResponse.json({
            id: created.id,
            title: generated.title,
            bullets: generated.bullets,
            description: generated.description,
            backendTerms: generated.backendTerms,
            keywords: body.keywords,
            version: created.version,
            warnings: generated.warnings,
            keywordUsage: generated.keywordUsage,
            // Return inputs
            productName: created.productName,
            brand: created.brand,
            targetAudience: created.targetAudience,
            features: created.features,
        })
    } catch (error) {
        console.error('Error generating listing:', error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to generate listing'
        }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const user = await getOrCreateUser()
        const draftId = request.nextUrl.searchParams.get('id')

        if (draftId) {
            // Get specific draft by ID
            const draft = await prisma.draft.findFirst({
                where: {
                    id: draftId,
                    userId: user.id,
                },
            })

            if (!draft) {
                return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
            }

            return NextResponse.json({
                id: draft.id,
                title: draft.title,
                bullets: draft.bullets,
                description: draft.description,
                backendTerms: draft.backendTerms,
                keywords: draft.keywords || [],
                version: draft.version,
                finalized: draft.finalized,
                // Return new fields
                productName: draft.productName,
                brand: draft.brand,
                targetAudience: draft.targetAudience,
                tone: draft.tone,
                features: draft.features,
                avoidWords: draft.avoidWords,
                createdAt: draft.createdAt,
                updatedAt: draft.updatedAt,
            })
        }

        // Get all drafts for user
        const drafts = await prisma.draft.findMany({
            where: { userId: user.id },
            orderBy: { updatedAt: 'desc' },
        })

        return NextResponse.json({ drafts })
    } catch (error) {
        console.error('Error fetching drafts:', error)
        return NextResponse.json({ error: 'Failed to fetch drafts' }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const user = await getOrCreateUser()
        const draftId = request.nextUrl.searchParams.get('id')

        if (!draftId) {
            return NextResponse.json({ error: 'Draft ID is required' }, { status: 400 })
        }

        const body = (await request.json()) as {
            title?: string
            bullets?: string[]
            description?: string
            backendTerms?: string | null
            keywords?: Array<{
                phrase: string
                searchVolume?: number
                selected: boolean
            }>
            finalized?: boolean
            // New fields
            productName?: string
            brand?: string
            targetAudience?: string
            tone?: string
            features?: string[]
            avoidWords?: string[]
        }

        // Verify ownership
        const existing = await prisma.draft.findFirst({
            where: { id: draftId, userId: user.id },
        })

        if (!existing) {
            return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
        }

        // Update draft
        const updated = await prisma.draft.update({
            where: { id: draftId },
            data: {
                title: body.title ?? existing.title,
                bullets: (body.bullets ?? existing.bullets) as unknown as object,
                description: body.description ?? existing.description,
                backendTerms: body.backendTerms !== undefined ? body.backendTerms : existing.backendTerms,
                keywords: (body.keywords ?? existing.keywords) as unknown as object,
                finalized: body.finalized ?? existing.finalized,
                // Update new fields
                productName: body.productName ?? existing.productName,
                brand: body.brand ?? existing.brand,
                targetAudience: body.targetAudience ?? existing.targetAudience,
                tone: body.tone ?? existing.tone,
                features: body.features ?? existing.features,
                avoidWords: body.avoidWords ?? existing.avoidWords,
            },
        })

        return NextResponse.json({
            id: updated.id,
            version: updated.version,
            finalized: updated.finalized,
            // Return updated fields to confirm save
            productName: updated.productName,
            brand: updated.brand,
        })
    } catch (error) {
        console.error('Error updating draft:', error)
        return NextResponse.json({ error: 'Failed to update draft' }, { status: 500 })
    }
}
