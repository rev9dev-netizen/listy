import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/ppc/ad-groups
 * Create a new ad group
 */
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { campaignId, name, defaultBid, status = "ENABLED" } = body;

        if (!campaignId || !name || !defaultBid) {
            return NextResponse.json(
                { error: "Missing required fields: campaignId, name, defaultBid" },
                { status: 400 }
            );
        }

        // Verify campaign exists and belongs to user
        const campaign = await prisma.ppcCampaign.findFirst({
            where: {
                id: campaignId,
                userId,
            },
        });

        if (!campaign) {
            return NextResponse.json(
                { error: "Campaign not found or access denied" },
                { status: 404 }
            );
        }

        // Create ad group
        const adGroup = await prisma.ppcAdGroup.create({
            data: {
                campaignId,
                name,
                defaultBid: parseFloat(defaultBid),
                status,
                adGroupId: `ag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Mock Amazon ad group ID
            },
        });

        // Mock: In production, this would call Amazon Ads API
        // await amazonAdsClient.createAdGroup({ ... })

        return NextResponse.json({
            success: true,
            adGroup,
            message: "Ad group created successfully",
        });
    } catch (error: any) {
        console.error("[PPC Ad Groups POST Error]", error);
        return NextResponse.json(
            { error: error.message || "Failed to create ad group" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/ppc/ad-groups?campaignId=xxx
 * Get all ad groups for a campaign
 */
export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const campaignId = searchParams.get("campaignId");

        if (!campaignId) {
            return NextResponse.json(
                { error: "Missing campaignId parameter" },
                { status: 400 }
            );
        }

        // Verify campaign belongs to user
        const campaign = await prisma.ppcCampaign.findFirst({
            where: {
                id: campaignId,
                userId,
            },
        });

        if (!campaign) {
            return NextResponse.json(
                { error: "Campaign not found or access denied" },
                { status: 404 }
            );
        }

        // Get ad groups with keyword counts
        const adGroups = await prisma.ppcAdGroup.findMany({
            where: {
                campaignId,
            },
            include: {
                _count: {
                    select: {
                        keywords: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json({
            success: true,
            adGroups,
        });
    } catch (error: any) {
        console.error("[PPC Ad Groups GET Error]", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch ad groups" },
            { status: 500 }
        );
    }
}
