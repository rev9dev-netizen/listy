import { NextResponse } from 'next/server';
import { LISTING_TEMPLATES } from '@/lib/listing-templates';

export async function GET() {
    return NextResponse.json({ templates: LISTING_TEMPLATES });
}
