import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/databse/prisma";

// GET - Fetch negative keywords
export async function GET(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const campaignId = searchParams.get("campaignId");
        const adGroupId = searchParams.get("adGroupId");

        // Fetch negative keywords with campaign/ad group info
        const negativeKeywords = await prisma.ppcKeyword.findMany({
            where: {
                adGroup: {
                    campaign: {
                        userId: user.id,
                        ...(campaignId ? { id: campaignId } : {}),
                    },
                    ...(adGroupId ? { id: adGroupId } : {}),
                },
                matchType: "Negative",
            },
            include: {
                adGroup: {
                    include: {
                        campaign: {
                            select: {
                                id: true,
                                campaignName: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json({ negativeKeywords });
    } catch (error) {
        console.error("Fetch negative keywords error:", error);
        return NextResponse.json(
            { error: "Failed to fetch negative keywords" },
            { status: 500 }
        );
    }
}

// POST - Add negative keyword
export async function POST(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const body = await request.json();
        const { keyword, adGroupId } = body;

        if (!keyword || !adGroupId) {
            return NextResponse.json(
                { error: "keyword and adGroupId are required" },
                { status: 400 }
            );
        }

        // Verify ownership
        const adGroup = await prisma.ppcAdGroup.findFirst({
            where: {
                id: adGroupId,
                campaign: {
                    userId: user.id,
                },
            },
        });

        if (!adGroup) {
            return NextResponse.json(
                { error: "Ad group not found or access denied" },
                { status: 404 }
            );
        }

        // Check if negative keyword already exists
        const existing = await prisma.ppcKeyword.findFirst({
            where: {
                keyword,
                adGroupId,
                matchType: "Negative",
            },
        });

        if (existing) {
            return NextResponse.json(
                { error: "Negative keyword already exists" },
                { status: 400 }
            );
        }

        // Create negative keyword
        const negativeKeyword = await prisma.ppcKeyword.create({
            data: {
                adGroupId,
                keyword,
                matchType: "Negative",
                bid: 0, // Negative keywords don't have bids
                status: "Active",
            },
            include: {
                adGroup: {
                    include: {
                        campaign: {
                            select: {
                                id: true,
                                campaignName: true,
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            negativeKeyword,
            message: "Negative keyword added successfully",
        });
    } catch (error) {
        console.error("Add negative keyword error:", error);
        return NextResponse.json(
            { error: "Failed to add negative keyword" },
            { status: 500 }
        );
    }
}

// DELETE - Remove negative keyword
export async function DELETE(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const keywordId = searchParams.get("id");

        if (!keywordId) {
            return NextResponse.json(
                { error: "Keyword ID is required" },
                { status: 400 }
            );
        }

        // Verify ownership and that it's a negative keyword
        const keyword = await prisma.ppcKeyword.findFirst({
            where: {
                id: keywordId,
                matchType: "Negative",
                adGroup: {
                    campaign: {
                        userId: user.id,
                    },
                },
            },
        });

        if (!keyword) {
            return NextResponse.json(
                { error: "Negative keyword not found or access denied" },
                { status: 404 }
            );
        }

        // Delete the negative keyword
        await prisma.ppcKeyword.delete({
            where: { id: keywordId },
        });

        return NextResponse.json({
            success: true,
            message: "Negative keyword removed successfully",
        });
    } catch (error) {
        console.error("Delete negative keyword error:", error);
        return NextResponse.json(
            { error: "Failed to remove negative keyword" },
            { status: 500 }
        );
    }
}
