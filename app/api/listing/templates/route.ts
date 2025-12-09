/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/databse/prisma';
import { LISTING_TEMPLATES } from '@/lib/listing-templates';

// GET - list all templates (system + user's custom)
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      // Return only system templates if not authenticated
      return NextResponse.json({ templates: LISTING_TEMPLATES });
    }

    // Get user's custom templates
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { templates: true },
    });

    // Combine system templates with user templates
    const allTemplates = [
      ...LISTING_TEMPLATES.map(t => ({ ...t, isSystem: true })),
      ...(user?.templates.map((t: any) => ({ ...t, isSystem: false })) || []),
    ];

    return NextResponse.json({ templates: allTemplates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    // Fallback to system templates on error
    return NextResponse.json({ templates: LISTING_TEMPLATES });
  }
}

// POST - create new template
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    
    const template = await prisma.listingTemplate.create({
      data: {
        userId: user.id,
        name: body.name,
        description: body.description,
        isDefault: body.isDefault || false,
        
        titleMinChars: body.titleMinChars || 150,
        titleMaxChars: body.titleMaxChars || 200,
        titleRequireKeyword: body.titleRequireKeyword ?? true,
        titleCapitalization: body.titleCapitalization || 'title',
        
        bulletMinChars: body.bulletMinChars || 180,
        bulletMaxChars: body.bulletMaxChars || 220,
        bulletCapitalizeFirst: body.bulletCapitalizeFirst ?? true,
        bulletFormat: body.bulletFormat || 'benefit-feature',
        
        descriptionMinChars: body.descriptionMinChars || 1500,
        descriptionMaxChars: body.descriptionMaxChars || 2000,
        useHtmlFormatting: body.useHtmlFormatting ?? true,
        
        avoidWords: body.avoidWords || [],
        tone: body.tone || 'professional',
        includeEmojis: body.includeEmojis || false,
        keywordDensity: body.keywordDensity || 'medium',
      },
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}

// PATCH - update template
export async function PATCH(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
    }

    const body = await req.json();

    const existing = await prisma.listingTemplate.findFirst({
      where: { id: templateId, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const template = await prisma.listingTemplate.update({
      where: { id: templateId },
      data: body,
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

// DELETE - delete template
export async function DELETE(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
    }

    const existing = await prisma.listingTemplate.findFirst({
      where: { id: templateId, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    await prisma.listingTemplate.delete({
      where: { id: templateId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
