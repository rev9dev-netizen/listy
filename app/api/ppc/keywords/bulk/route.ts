import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/databse/prisma";

export async function PATCH(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { keywordIds, action, value } = body;

        if (!keywordIds || !Array.isArray(keywordIds) || keywordIds.length === 0) {
            return NextResponse.json(
                { error: "keywordIds array is required" },
                { status: 400 }
            );
        }

        if (!action) {
            return NextResponse.json(
                { error: "action is required" },
                { status: 400 }
            );
        }

        // Verify ownership of all keywords
        const keywords = await prisma.ppcKeyword.findMany({
            where: {
                id: { in: keywordIds },
            },
            include: {
                adGroup: {
                    include: {
                        campaign: true,
                    },
                },
            },
        });

        if (keywords.length === 0) {
            return NextResponse.json(
                { error: "No keywords found" },
                { status: 404 }
            );
        }

        let updateData: Record<string, unknown> = {};

        switch (action) {
            case "increaseByPercent":
                if (typeof value !== "number" || value <= 0) {
                    return NextResponse.json(
                        { error: "Valid positive percentage value required" },
                        { status: 400 }
                    );
                }
                // Increase each keyword's bid by percentage
                await Promise.all(
                    keywords.map((keyword) =>
                        prisma.ppcKeyword.update({
                            where: { id: keyword.id },
                            data: {
                                bid: keyword.bid * (1 + value / 100),
                                bidHistory: {
                                    create: {
                                        oldBid: keyword.bid,
                                        newBid: keyword.bid * (1 + value / 100),
                                        reason: `Bulk increase by ${value}%`,
                                    },
                                },
                            },
                        })
                    )
                );
                break;

            case "decreaseByPercent":
                if (typeof value !== "number" || value <= 0) {
                    return NextResponse.json(
                        { error: "Valid positive percentage value required" },
                        { status: 400 }
                    );
                }
                // Decrease each keyword's bid by percentage
                await Promise.all(
                    keywords.map((keyword) =>
                        prisma.ppcKeyword.update({
                            where: { id: keyword.id },
                            data: {
                                bid: Math.max(0.02, keyword.bid * (1 - value / 100)), // Minimum bid $0.02
                                bidHistory: {
                                    create: {
                                        oldBid: keyword.bid,
                                        newBid: Math.max(0.02, keyword.bid * (1 - value / 100)),
                                        reason: `Bulk decrease by ${value}%`,
                                    },
                                },
                            },
                        })
                    )
                );
                break;

            case "setSpecificBid":
                if (typeof value !== "number" || value < 0.02) {
                    return NextResponse.json(
                        { error: "Bid must be at least $0.02" },
                        { status: 400 }
                    );
                }
                updateData = {
                    bid: value,
                };
                // Set specific bid for all keywords
                await Promise.all(
                    keywords.map((keyword) =>
                        prisma.ppcKeyword.update({
                            where: { id: keyword.id },
                            data: {
                                bid: value,
                                bidHistory: {
                                    create: {
                                        oldBid: keyword.bid,
                                        newBid: value,
                                        reason: `Bulk set to $${value}`,
                                    },
                                },
                            },
                        })
                    )
                );
                break;

            case "pause":
                updateData = { status: "Paused" };
                await prisma.ppcKeyword.updateMany({
                    where: { id: { in: keywordIds } },
                    data: updateData,
                });
                break;

            case "resume":
                updateData = { status: "Active" };
                await prisma.ppcKeyword.updateMany({
                    where: { id: { in: keywordIds } },
                    data: updateData,
                });
                break;

            default:
                return NextResponse.json(
                    { error: "Invalid action. Use increaseByPercent, decreaseByPercent, setSpecificBid, pause, or resume" },
                    { status: 400 }
                );
        }

        // Fetch updated keywords
        const updatedKeywords = await prisma.ppcKeyword.findMany({
            where: { id: { in: keywordIds } },
            include: {
                adGroup: {
                    include: {
                        campaign: true,
                    },
                },
            },
        });

        return NextResponse.json({
            message: `Successfully updated ${updatedKeywords.length} keywords`,
            keywords: updatedKeywords,
        });
    } catch (error) {
        console.error("Bulk keyword update error:", error);
        return NextResponse.json(
            { error: "Failed to update keywords" },
            { status: 500 }
        );
    }
}
