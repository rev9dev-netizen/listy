import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { validateListing } from '@/lib/services/listing-service'
import type { ListingDraft, ListingDraftRequest } from '@/lib/types'

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = (await request.json()) as {
            draft: ListingDraft
            request: ListingDraftRequest
        }

        // Validate request
        if (!body.draft || !body.request) {
            return NextResponse.json(
                { error: 'Draft and request parameters are required' },
                { status: 400 }
            )
        }

        // Validate listing
        const issues = validateListing(body.draft, body.request)

        return NextResponse.json({
            valid: issues.filter((i) => i.severity === 'error').length === 0,
            issues,
        })
    } catch (error) {
        console.error('Error validating listing:', error)
        return NextResponse.json({ error: 'Failed to validate listing' }, { status: 500 })
    }
}
