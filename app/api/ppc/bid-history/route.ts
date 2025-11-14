import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/databse/prisma";

// GET - Fetch bid history for keywords
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
        const keywordId = searchParams.get("keywordId");
        const campaignId = searchParams.get("campaignId");
        const adGroupId = searchParams.get("adGroupId");
        const limit = parseInt(searchParams.get("limit") || "50");

        // Build where clause
        const where: {
            keyword?: {
                adGroup: {
                    campaign: {
                        userId: string;
                    };
                };
            };
            keywordId?: string;
            keyword2?: {
                adGroup: {
                    campaignId?: string;
                    id?: string;
                };
            };
        } = {
            keyword: {
                adGroup: {
                    campaign: {
                        userId: user.id,
                    },
                },
            },
        };

        if (keywordId) {
            where.keywordId = keywordId;
        }

        if (campaignId || adGroupId) {
            where.keyword2 = {
                adGroup: {},
            };
            if (campaignId) {
                where.keyword2.adGroup.campaignId = campaignId;
            }
            if (adGroupId) {
                where.keyword2.adGroup.id = adGroupId;
            }
        }

        const bidHistory = await prisma.ppcBidHistory.findMany({
            where,
            include: {
                keyword: {
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
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            take: limit,
        });

        return NextResponse.json(bidHistory);
    } catch (error) {
        console.error("Bid history fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch bid history" },
            { status: 500 }
        );
    }
}

// POST - Rollback bid to previous value
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
        const { historyId } = body;

        if (!historyId) {
            return NextResponse.json(
                { error: "historyId is required" },
                { status: 400 }
            );
        }

        // Fetch the history record
        const historyRecord = await prisma.ppcBidHistory.findFirst({
            where: {
                id: historyId,
                keyword: {
                    adGroup: {
                        campaign: {
                            userId: user.id,
                        },
                    },
                },
            },
            include: {
                keyword: true,
            },
        });

        if (!historyRecord) {
            return NextResponse.json(
                { error: "History record not found" },
                { status: 404 }
            );
        }

        // Get current bid
        const currentKeyword = await prisma.ppcKeyword.findUnique({
            where: { id: historyRecord.keywordId },
        });

        if (!currentKeyword) {
            return NextResponse.json({ error: "Keyword not found" }, { status: 404 });
        }

        const currentBid = currentKeyword.bid;
        const rollbackBid = historyRecord.oldBid;

        // Update keyword bid
        const updatedKeyword = await prisma.ppcKeyword.update({
            where: { id: historyRecord.keywordId },
            data: { bid: rollbackBid },
        });

        // Create new history record for the rollback
        await prisma.ppcBidHistory.create({
            data: {
                keywordId: historyRecord.keywordId,
                oldBid: currentBid,
                newBid: rollbackBid,
                reason: `Rollback to previous bid from ${historyRecord.createdAt.toISOString()}`,
                changedBy: "User", // Track that this was a manual rollback
                ruleApplied: null,
            },
        }); return NextResponse.json({
            success: true,
            keyword: updatedKeyword,
            message: `Bid rolled back from $${currentBid} to $${rollbackBid}`,
        });
    } catch (error) {
        console.error("Bid rollback error:", error);
        return NextResponse.json(
            { error: "Failed to rollback bid" },
            { status: 500 }
        );
    }
}
