import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/databse/prisma";
import { predictOptimalBid } from "@/lib/services/ppc-ai-engine";

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { keywordId } = body;

        if (!keywordId) {
            return NextResponse.json(
                { error: "Missing keyword ID" },
                { status: 400 }
            );
        }

        // Fetch keyword with historical data
        const keyword = await prisma.ppcKeyword.findFirst({
            where: {
                id: keywordId,
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
                metrics: {
                    where: {
                        date: {
                            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
                        },
                    },
                    orderBy: {
                        date: "desc",
                    },
                },
                bidHistory: {
                    orderBy: {
                        createdAt: "desc",
                    },
                    take: 10,
                },
            },
        });

        if (!keyword) {
            return NextResponse.json(
                { error: "Keyword not found" },
                { status: 404 }
            );
        }

        // Get AI prediction - add keyword field to metrics
        const metricsWithKeyword = keyword.metrics.map(m => ({
            ...m,
            keyword: keyword.keyword
        }));

        const prediction = await predictOptimalBid(
            keyword.keyword,
            keyword.bid,
            metricsWithKeyword,
            keyword.adGroup.campaign.targetAcos || 30,
            0.3 // Assume 30% profit margin
        );

        // Store prediction in database
        await prisma.ppcAiBidPrediction.create({
            data: {
                keywordId: keyword.id,
                predictedCPC: prediction.predictedCPC,
                predictedClicks: prediction.predictedClicks,
                predictedSales: prediction.predictedSales,
                predictedAcos: prediction.predictedAcos,
                recommendedBid: prediction.recommendedBid,
                confidence: prediction.confidence,
                reasoning: prediction.reasoning,
                predictionDate: new Date(),
            },
        });

        return NextResponse.json({ prediction, keyword });
    } catch (error) {
        console.error("Failed to predict bid:", error);
        return NextResponse.json(
            { error: "Failed to predict bid" },
            { status: 500 }
        );
    }
}
