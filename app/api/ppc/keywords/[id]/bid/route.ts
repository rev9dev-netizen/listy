import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { bid, reason } = body;

        if (!bid || bid <= 0) {
            return NextResponse.json(
                { error: "Invalid bid amount" },
                { status: 400 }
            );
        }

        // Verify the keyword belongs to the user
        const keyword = await prisma.ppcKeyword.findFirst({
            where: {
                id: params.id,
                adGroup: {
                    campaign: {
                        userId,
                    },
                },
            },
            include: {
                adGroup: {
                    include: {
                        campaign: true,
                    },
                },
            },
        });

        if (!keyword) {
            return NextResponse.json(
                { error: "Keyword not found" },
                { status: 404 }
            );
        }

        // Store old bid for history
        const oldBid = keyword.bid;

        // Update keyword bid
        const updatedKeyword = await prisma.ppcKeyword.update({
            where: { id: params.id },
            data: {
                bid,
                bidHistory: {
                    create: {
                        oldBid,
                        newBid: bid,
                        reason: reason || "Manual bid adjustment",
                    },
                },
            },
            include: {
                adGroup: {
                    include: {
                        campaign: true,
                    },
                },
                bidHistory: {
                    orderBy: {
                        createdAt: "desc",
                    },
                    take: 1,
                },
            },
        });

        return NextResponse.json({ keyword: updatedKeyword });
    } catch (error) {
        console.error("Failed to update bid:", error);
        return NextResponse.json(
            { error: "Failed to update bid" },
            { status: 500 }
        );
    }
}
