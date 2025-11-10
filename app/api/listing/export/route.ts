import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import type { ListingDraft } from '@/lib/types'

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = (await request.json()) as {
            format: 'amazon' | 'csv' | 'json'
            listing: ListingDraft
            productData?: Record<string, string>
        }

        // Validate request
        if (!body.format || !body.listing) {
            return NextResponse.json(
                { error: 'Format and listing are required' },
                { status: 400 }
            )
        }

        let data: string | object
        let filename: string
        let contentType: string

        switch (body.format) {
            case 'json':
                data = body.listing
                filename = `listing-${Date.now()}.json`
                contentType = 'application/json'
                break

            case 'csv':
                data = convertToCSV(body.listing)
                filename = `listing-${Date.now()}.csv`
                contentType = 'text/csv'
                break

            case 'amazon':
                data = convertToAmazonFormat(body.listing, body.productData)
                filename = `amazon-listing-${Date.now()}.txt`
                contentType = 'text/plain'
                break

            default:
                return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
        }

        return NextResponse.json(
            {
                data,
                filename,
            },
            {
                headers: {
                    'Content-Type': contentType,
                },
            }
        )
    } catch (error) {
        console.error('Error exporting listing:', error)
        return NextResponse.json({ error: 'Failed to export listing' }, { status: 500 })
    }
}

function convertToCSV(listing: ListingDraft): string {
    const headers = ['Field', 'Content']
    const rows = [
        ['Title', listing.title],
        ['Bullet 1', listing.bullets[0] || ''],
        ['Bullet 2', listing.bullets[1] || ''],
        ['Bullet 3', listing.bullets[2] || ''],
        ['Bullet 4', listing.bullets[3] || ''],
        ['Bullet 5', listing.bullets[4] || ''],
        ['Description', listing.description],
    ]

    const csvContent = [
        headers.join(','),
        ...rows.map((row) => `"${row[0]}","${row[1].replace(/"/g, '""')}"`),
    ].join('\n')

    return csvContent
}

function convertToAmazonFormat(
    listing: ListingDraft,
    productData?: Record<string, string>
): string {
    return `Amazon Product Listing

Product Title:
${listing.title}

Key Product Features:
${listing.bullets.map((bullet, i) => `${i + 1}. ${bullet}`).join('\n')}

Product Description:
${listing.description}

${productData
            ? `
Additional Product Data:
${Object.entries(productData)
                .map(([key, value]) => `${key}: ${value}`)
                .join('\n')}
`
            : ''
        }`
}
