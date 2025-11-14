import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/databse/prisma";
import {
    calculateKeywordQualityScore,
    detectKeywordLifecycle,
    calculateKeywordProfit,
} from "@/lib/services/ppc-keyword-quality";

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { keywordId, cogsPercent, feePercent } = body;

        if (!keywordId) {
            return NextResponse.json(
                { error: "Missing keywordId" },
                { status: 400 }
            );
        }

        // Fetch keyword with metrics
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
                metrics: {
                    orderBy: {
                        date: "desc",
                    },
                    take: 30, // Last 30 days
                },
                adGroup: {
                    include: {
                        campaign: true,
                    },
                },
            },
        });

        if (!keyword) {
            return NextResponse.json({ error: "Keyword not found" }, { status: 404 });
        }

        // Aggregate metrics from last 30 days
        const aggregatedMetrics = keyword.metrics.reduce(
            (acc, m) => ({
                impressions: acc.impressions + m.impressions,
                clicks: acc.clicks + m.clicks,
                conversions: acc.conversions + (m.orders || 0),
                spend: acc.spend + m.spend,
                sales: acc.sales + m.sales,
                ctr: 0,
                conversionRate: 0,
                acos: 0,
            }),
            {
                impressions: 0,
                clicks: 0,
                conversions: 0,
                spend: 0,
                sales: 0,
                ctr: 0,
                conversionRate: 0,
                acos: 0,
            }
        );

        // Calculate derived metrics
        aggregatedMetrics.ctr =
            aggregatedMetrics.impressions > 0
                ? (aggregatedMetrics.clicks / aggregatedMetrics.impressions) * 100
                : 0;
        aggregatedMetrics.conversionRate =
            aggregatedMetrics.clicks > 0
                ? (aggregatedMetrics.conversions / aggregatedMetrics.clicks) * 100
                : 0;
        aggregatedMetrics.acos =
            aggregatedMetrics.sales > 0
                ? (aggregatedMetrics.spend / aggregatedMetrics.sales) * 100
                : 0;

        // Calculate quality score
        const qualityResult = calculateKeywordQualityScore(aggregatedMetrics);

        // Detect lifecycle
        const lifecycle = detectKeywordLifecycle(
            keyword.createdAt,
            aggregatedMetrics,
            qualityResult.score
        );

        // Calculate profit
        const profitCalc = calculateKeywordProfit(
            aggregatedMetrics.sales,
            aggregatedMetrics.spend,
            cogsPercent || 0.30,
            feePercent || 0.15
        );

        // Update keyword with new scores
        const updatedKeyword = await prisma.ppcKeyword.update({
            where: { id: keywordId },
            data: {
                qualityScore: qualityResult.score,
                lifecycle,
                profitScore: profitCalc.profitMargin,
                conversionProb: aggregatedMetrics.conversionRate,
            },
        });

        return NextResponse.json({
            keyword: updatedKeyword,
            quality: qualityResult,
            lifecycle,
            profit: profitCalc,
            metrics: aggregatedMetrics,
        });
    } catch (error) {
        console.error("Failed to calculate keyword quality:", error);
        return NextResponse.json(
            { error: "Failed to calculate keyword quality" },
            { status: 500 }
        );
    }
}

// Batch update all keywords for a campaign
export async function PATCH(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { campaignId, cogsPercent, feePercent } = body;

        // Fetch all keywords for campaign
        const keywords = await prisma.ppcKeyword.findMany({
            where: {
                adGroup: {
                    campaign: {
                        id: campaignId,
                        userId,
                    },
                },
            },
            include: {
                metrics: {
                    orderBy: {
                        date: "desc",
                    },
                    take: 30,
                },
            },
        });

        const updates = [];

        for (const keyword of keywords) {
            // Aggregate metrics
            const aggregatedMetrics = keyword.metrics.reduce(
                (acc, m) => ({
                    impressions: acc.impressions + m.impressions,
                    clicks: acc.clicks + m.clicks,
                    conversions: acc.conversions + (m.orders || 0),
                    spend: acc.spend + m.spend,
                    sales: acc.sales + m.sales,
                    ctr: 0,
                    conversionRate: 0,
                    acos: 0,
                }),
                {
                    impressions: 0,
                    clicks: 0,
                    conversions: 0,
                    spend: 0,
                    sales: 0,
                    ctr: 0,
                    conversionRate: 0,
                    acos: 0,
                }
            );

            aggregatedMetrics.ctr =
                aggregatedMetrics.impressions > 0
                    ? (aggregatedMetrics.clicks / aggregatedMetrics.impressions) * 100
                    : 0;
            aggregatedMetrics.conversionRate =
                aggregatedMetrics.clicks > 0
                    ? (aggregatedMetrics.conversions / aggregatedMetrics.clicks) * 100
                    : 0;
            aggregatedMetrics.acos =
                aggregatedMetrics.sales > 0
                    ? (aggregatedMetrics.spend / aggregatedMetrics.sales) * 100
                    : 0;

            const qualityResult = calculateKeywordQualityScore(aggregatedMetrics);
            const lifecycle = detectKeywordLifecycle(
                keyword.createdAt,
                aggregatedMetrics,
                qualityResult.score
            );
            const profitCalc = calculateKeywordProfit(
                aggregatedMetrics.sales,
                aggregatedMetrics.spend,
                cogsPercent || 0.30,
                feePercent || 0.15
            );

            updates.push({
                id: keyword.id,
                qualityScore: qualityResult.score,
                lifecycle,
                profitScore: profitCalc.profitMargin,
            });
        }

        // Batch update
        await Promise.all(
            updates.map((update) =>
                prisma.ppcKeyword.update({
                    where: { id: update.id },
                    data: {
                        qualityScore: update.qualityScore,
                        lifecycle: update.lifecycle,
                        profitScore: update.profitScore,
                    },
                })
            )
        );

        return NextResponse.json({
            success: true,
            updated: updates.length,
            keywords: updates,
        });
    } catch (error) {
        console.error("Failed to batch update keyword quality:", error);
        return NextResponse.json(
            { error: "Failed to batch update keyword quality" },
            { status: 500 }
        );
    }
}
