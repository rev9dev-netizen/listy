import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/databse/prisma";
import { calculateKeywordProfit } from "@/lib/services/ppc-keyword-quality";

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const adGroupId = searchParams.get("adGroupId");
        const campaignId = searchParams.get("campaignId");

        const where: { adGroup: { campaign: { userId: string; id?: string } }; adGroupId?: string } = { adGroup: { campaign: { userId } } };
        if (campaignId) { where.adGroup.campaign.id = campaignId; }
        if (adGroupId) { where.adGroupId = adGroupId; }

        const keywords = await prisma.ppcKeyword.findMany({ where, include: { adGroup: { include: { campaign: { select: { id: true, campaignName: true } } } }, metrics: { where: { date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }, orderBy: { date: "desc" } }, bidHistory: { orderBy: { createdAt: "desc" }, take: 5 } }, orderBy: { createdAt: "desc" } });

        // Calculate aggregated metrics and profit for each keyword
        const keywordsWithMetrics = keywords.map((keyword) => {
            // Aggregate metrics from last 30 days
            const aggregated = keyword.metrics.reduce(
                (acc, m) => ({
                    impressions: acc.impressions + m.impressions,
                    clicks: acc.clicks + m.clicks,
                    conversions: acc.conversions + (m.orders || 0),
                    spend: acc.spend + m.spend,
                    sales: acc.sales + m.sales,
                }),
                { impressions: 0, clicks: 0, conversions: 0, spend: 0, sales: 0 }
            );

            // Calculate derived metrics
            const ctr = aggregated.impressions > 0 ? (aggregated.clicks / aggregated.impressions) * 100 : 0;
            const conversionRate = aggregated.clicks > 0 ? (aggregated.conversions / aggregated.clicks) * 100 : 0;
            const acos = aggregated.sales > 0 ? (aggregated.spend / aggregated.sales) * 100 : 0;
            const cpc = aggregated.clicks > 0 ? aggregated.spend / aggregated.clicks : 0;

            // Calculate profit (30% COGS, 15% fees by default)
            const profit = calculateKeywordProfit(aggregated.sales, aggregated.spend, 0.30, 0.15);

            return {
                ...keyword,
                impressions: aggregated.impressions,
                clicks: aggregated.clicks,
                conversions: aggregated.conversions,
                spend: aggregated.spend,
                sales: aggregated.sales,
                ctr,
                conversionRate,
                acos,
                cpc,
                netProfit: profit.netProfit,
            };
        });

        return NextResponse.json({ keywords: keywordsWithMetrics });
    } catch (error) {
        console.error("Failed to fetch keywords:", error);
        return NextResponse.json({ error: "Failed to fetch keywords" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

        const body = await request.json();
        const { adGroupId, keywords } = body;

        // Support both single keyword and bulk creation
        const keywordsList = Array.isArray(keywords) ? keywords : [{ keyword: body.keyword, matchType: body.matchType, bid: body.bid, status: body.status }];

        if (!adGroupId || keywordsList.length === 0) {
            return NextResponse.json({ error: "Missing required fields: adGroupId and keywords" }, { status: 400 });
        }

        const adGroup = await prisma.ppcAdGroup.findFirst({
            where: { id: adGroupId, campaign: { userId } },
            include: { campaign: true }
        });
        if (!adGroup) { return NextResponse.json({ error: "Ad group not found" }, { status: 404 }); }

        const createdKeywords = [];
        const errors = [];

        for (const kw of keywordsList) {
            try {
                const { keyword, matchType = "BROAD", bid, status = "ENABLED" } = kw;
                if (!keyword || !bid) {
                    errors.push({ keyword: keyword || "unknown", error: "Missing keyword or bid" });
                    continue;
                }

                const bidAmount = parseFloat(bid);
                if (isNaN(bidAmount) || bidAmount <= 0) {
                    errors.push({ keyword, error: "Invalid bid amount" });
                    continue;
                }

                // Calculate AI quality score (placeholder for now)
                const qualityScore = 50;

                const newKeywordRecord = await prisma.ppcKeyword.create({
                    data: {
                        keyword,
                        matchType,
                        bid: bidAmount,
                        status,
                        qualityScore,
                        lifecycle: "DISCOVERY",
                        adGroupId,
                    },
                    include: { adGroup: { include: { campaign: true } } }
                });

                // Create initial bid history
                await prisma.ppcBidHistory.create({
                    data: {
                        keywordId: newKeywordRecord.id,
                        oldBid: 0,
                        newBid: bidAmount,
                        reason: "Initial keyword creation",
                    },
                });

                createdKeywords.push(newKeywordRecord);
            } catch (error) {
                errors.push({ keyword: kw.keyword, error: error instanceof Error ? error.message : "Unknown error" });
            }
        }

        return NextResponse.json({
            success: true,
            created: createdKeywords.length,
            failed: errors.length,
            keywords: createdKeywords,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error) {
        console.error("Failed to create keywords:", error);
        return NextResponse.json({ error: "Failed to create keywords" }, { status: 500 });
    }
}