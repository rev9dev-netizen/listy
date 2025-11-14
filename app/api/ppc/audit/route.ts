/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { calculateKeywordQualityScore } from "@/lib/services/ppc-ai-engine";

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { campaignId } = body;

        if (!campaignId) {
            return NextResponse.json(
                { error: "Missing campaign ID" },
                { status: 400 }
            );
        }

        // Fetch campaign with all data
        const campaign = await prisma.ppcCampaign.findFirst({
            where: {
                id: campaignId,
                userId,
            },
            include: {
                adGroups: {
                    include: {
                        keywords: {
                            include: {
                                metrics: {
                                    where: {
                                        date: {
                                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                                        },
                                    },
                                    orderBy: {
                                        date: "desc",
                                    },
                                },
                            },
                        },
                    },
                },
                metrics: {
                    where: {
                        date: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                        },
                    },
                    orderBy: {
                        date: "desc",
                    },
                },
            },
        });

        if (!campaign) {
            return NextResponse.json(
                { error: "Campaign not found" },
                { status: 404 }
            );
        }

        // Audit results
        const audit = {
            campaignName: campaign.campaignName,
            overallScore: 0,
            issues: [] as {
                severity: "critical" | "warning" | "info";
                category: string;
                message: string;
                recommendation: string;
            }[],
            opportunities: [] as {
                type: string;
                message: string;
                potentialImpact: string;
            }[],
            keywordAnalysis: [] as {
                keywordId: string;
                keywordText: string;
                qualityScore: number;
                issues: string[];
            }[],
        };

        // Calculate campaign metrics
        const totalSpend = campaign.metrics.reduce((sum, m) => sum + m.spend, 0);
        const totalSales = campaign.metrics.reduce((sum, m) => sum + m.sales, 0);
        const avgAcos =
            campaign.metrics.reduce((sum, m) => sum + m.acos, 0) /
            Math.max(campaign.metrics.length, 1);
        const totalImpressions = campaign.metrics.reduce(
            (sum, m) => sum + m.impressions,
            0
        );
        const totalClicks = campaign.metrics.reduce((sum, m) => sum + m.clicks, 0);
        const avgCtr = totalClicks / Math.max(totalImpressions, 1);

        // Budget utilization check
        const avgDailySpend = totalSpend / 30;
        const budgetUtilization = avgDailySpend / campaign.dailyBudget;

        if (budgetUtilization < 0.5) {
            audit.issues.push({
                severity: "warning",
                category: "Budget",
                message: `Budget underutilized (${(budgetUtilization * 100).toFixed(1)}%)`,
                recommendation:
                    "Consider reducing daily budget or increasing bids to maximize spend potential.",
            });
        } else if (budgetUtilization > 0.95) {
            audit.issues.push({
                severity: "critical",
                category: "Budget",
                message: "Budget nearly exhausted daily",
                recommendation:
                    "Increase daily budget to avoid losing impression share during peak hours.",
            });
        }

        // ACOS check
        if (campaign.targetAcos && avgAcos > campaign.targetAcos * 1.2) {
            audit.issues.push({
                severity: "critical",
                category: "ACOS",
                message: `ACOS (${avgAcos.toFixed(1)}%) significantly above target (${campaign.targetAcos}%)`,
                recommendation:
                    "Review and pause high ACOS keywords. Consider lowering bids on underperforming terms.",
            });
        }

        // CTR check
        if (avgCtr < 0.003) {
            audit.issues.push({
                severity: "warning",
                category: "CTR",
                message: `Low Click-Through Rate (${(avgCtr * 100).toFixed(2)}%)`,
                recommendation:
                    "Improve ad copy, use more relevant keywords, or adjust match types.",
            });
        }

        // Analyze keywords
        let totalKeywordScore = 0;
        let keywordCount = 0;

        for (const adGroup of campaign.adGroups) {
            for (const keyword of adGroup.keywords) {
                if (keyword.metrics.length === 0) continue;

                const recentMetrics = keyword.metrics.slice(0, 30);
                const olderMetrics = keyword.metrics.slice(30, 60);

                // Add keyword field to metrics for AI function
                const recentMetricsWithKeyword = recentMetrics.map(m => ({ ...m, keyword: keyword.keyword }));
                const olderMetricsWithKeyword = olderMetrics.map(m => ({ ...m, keyword: keyword.keyword }));

                const qualityAnalysis = await calculateKeywordQualityScore(
                    keyword.keyword,
                    recentMetricsWithKeyword[0],
                    olderMetricsWithKeyword,
                    0.3 // Assume 30% profit margin
                );

                totalKeywordScore += qualityAnalysis.overallScore;
                keywordCount++;

                const keywordIssues: string[] = [];

                if (qualityAnalysis.overallScore < 50) {
                    keywordIssues.push("Low quality score - consider pausing");
                }

                if (qualityAnalysis.lifecycle === "Decline") {
                    keywordIssues.push("Declining performance trend");
                }

                if (recentMetrics[0].acos > (campaign.targetAcos || 30) * 1.5) {
                    keywordIssues.push(`High ACOS (${recentMetrics[0].acos.toFixed(1)}%)`);
                }

                if (keywordIssues.length > 0) {
                    audit.keywordAnalysis.push({
                        keywordId: keyword.id,
                        keywordText: keyword.keyword,
                        qualityScore: qualityAnalysis.overallScore,
                        issues: keywordIssues,
                    });
                }

                // Find opportunities
                if (
                    qualityAnalysis.overallScore > 70 &&
                    qualityAnalysis.lifecycle === "Growth"
                ) {
                    audit.opportunities.push({
                        type: "Increase Bid",
                        message: `"${keyword.keyword}" shows strong performance`,
                        potentialImpact: "Could increase sales by 15-25%",
                    });
                }
            }
        }

        // Calculate overall score
        const budgetScore = budgetUtilization > 0.7 && budgetUtilization < 0.95 ? 100 : 50;
        const acosScore = campaign.targetAcos
            ? Math.max(0, 100 - ((avgAcos - campaign.targetAcos) / campaign.targetAcos) * 100)
            : 75;
        const ctrScore = avgCtr > 0.01 ? 100 : avgCtr > 0.005 ? 75 : 50;
        const keywordScore = keywordCount > 0 ? totalKeywordScore / keywordCount : 50;

        audit.overallScore = Math.round(
            (budgetScore * 0.2 + acosScore * 0.35 + ctrScore * 0.15 + keywordScore * 0.3)
        );

        // Store audit report
        await prisma.ppcAuditReport.create({
            data: {
                userId,
                campaignId: campaign.id,
                overallScore: audit.overallScore,
                findings: audit,
                recommendations: audit.issues.map((i) => i.recommendation),
            },
        });

        return NextResponse.json({ audit });
    } catch (error) {
        console.error("Failed to generate audit:", error);
        return NextResponse.json(
            { error: "Failed to generate audit" },
            { status: 500 }
        );
    }
}
