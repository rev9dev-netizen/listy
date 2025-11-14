import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

interface CampaignPerformance {
    id: string;
    name: string;
    currentBudget: number;
    spend: number;
    sales: number;
    acos: number;
    roas: number;
    orders: number;
    efficiency: number;
}

export async function POST(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { totalBudget } = body;

        if (!totalBudget) {
            return NextResponse.json(
                { error: "totalBudget is required" },
                { status: 400 }
            );
        }

        // Fetch all active campaigns for the user
        const campaigns = await prisma.ppcCampaign.findMany({
            where: {
                userId,
                status: "Active",
            },
            include: {
                metrics: {
                    where: {
                        date: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                        },
                    },
                },
            },
        });

        if (campaigns.length === 0) {
            return NextResponse.json(
                { error: "No active campaigns found" },
                { status: 404 }
            );
        }

        // Calculate performance metrics for each campaign
        const campaignPerformance: CampaignPerformance[] = campaigns.map((campaign) => {
            const totalSpend = campaign.metrics.reduce((sum: number, m) => sum + m.spend, 0);
            const totalSales = campaign.metrics.reduce((sum: number, m) => sum + m.sales, 0);
            const totalConversions = campaign.metrics.reduce((sum: number, m) => sum + m.orders, 0);

            const acos = totalSales > 0 ? (totalSpend / totalSales) * 100 : 999;
            const roas = totalSpend > 0 ? totalSales / totalSpend : 0;

            // Efficiency score: combination of ROAS and conversion rate
            // Higher ROAS = better, lower ACOS = better
            const efficiency = roas > 0 ? (roas * 100) / (acos || 1) : 0;

            return {
                id: campaign.id,
                name: campaign.campaignName,
                currentBudget: campaign.dailyBudget,
                spend: totalSpend,
                sales: totalSales,
                acos,
                roas,
                orders: totalConversions,
                efficiency,
            };
        });

        // Sort campaigns by efficiency (best performers first)
        const sortedCampaigns = [...campaignPerformance].sort(
            (a, b) => b.efficiency - a.efficiency
        );

        // Calculate recommended budget allocation
        const recommendations = sortedCampaigns.map((campaign, index) => {
            let recommendedBudget: number;
            let reasoning: string;

            // Top 25% performers get increased budget
            if (index < Math.ceil(sortedCampaigns.length * 0.25)) {
                const increasePercent = 30 - (index * 5); // 30%, 25%, 20%...
                recommendedBudget = campaign.currentBudget * (1 + increasePercent / 100);
                reasoning = `High performer (ROAS: ${campaign.roas.toFixed(2)}x, ACOS: ${campaign.acos.toFixed(1)}%). Increase budget by ${increasePercent}% to maximize returns.`;
            }
            // Bottom 25% performers get decreased budget
            else if (index >= Math.ceil(sortedCampaigns.length * 0.75)) {
                const decreasePercent = 20 + ((index - Math.ceil(sortedCampaigns.length * 0.75)) * 5);
                recommendedBudget = campaign.currentBudget * (1 - decreasePercent / 100);
                reasoning = `Underperformer (ROAS: ${campaign.roas.toFixed(2)}x, ACOS: ${campaign.acos.toFixed(1)}%). Decrease budget by ${decreasePercent}% and reinvest in better campaigns.`;
            }
            // Middle 50% maintain or slightly adjust
            else {
                const adjustment = campaign.efficiency > 50 ? 1.1 : 0.95;
                recommendedBudget = campaign.currentBudget * adjustment;
                reasoning = `Average performer. ${adjustment > 1 ? 'Slightly increase' : 'Slightly decrease'} budget based on efficiency score.`;
            }

            return {
                ...campaign,
                recommendedBudget: Math.max(1, recommendedBudget), // Minimum $1/day
                change: recommendedBudget - campaign.currentBudget,
                changePercent: ((recommendedBudget - campaign.currentBudget) / campaign.currentBudget) * 100,
                reasoning,
            };
        });

        // Normalize to total budget
        const totalRecommended = recommendations.reduce((sum, r) => sum + r.recommendedBudget, 0);
        const normalizationFactor = totalBudget / totalRecommended;

        const normalizedRecommendations = recommendations.map((rec) => ({
            ...rec,
            recommendedBudget: Math.max(1, rec.recommendedBudget * normalizationFactor),
            change: (rec.recommendedBudget * normalizationFactor) - rec.currentBudget,
            changePercent: (((rec.recommendedBudget * normalizationFactor) - rec.currentBudget) / rec.currentBudget) * 100,
        }));

        // Calculate expected impact
        const currentTotalSpend = campaignPerformance.reduce((sum, c) => sum + c.spend, 0);
        const currentTotalSales = campaignPerformance.reduce((sum, c) => sum + c.sales, 0);
        const currentAvgAcos = currentTotalSpend > 0 ? (currentTotalSpend / currentTotalSales) * 100 : 0;
        const currentAvgRoas = currentTotalSpend > 0 ? currentTotalSales / currentTotalSpend : 0;

        // Estimate new performance (simplified model)
        const estimatedSalesIncrease = normalizedRecommendations.reduce((sum, rec) => {
            if (rec.changePercent > 0) {
                // Increased budget on high performers
                return sum + (rec.sales * (rec.changePercent / 100) * 0.7); // 70% efficiency
            }
            return sum;
        }, 0);

        const expectedTotalSales = currentTotalSales + estimatedSalesIncrease;
        const expectedAcos = totalBudget > 0 ? (totalBudget / expectedTotalSales) * 100 : 0;
        const expectedRoas = totalBudget > 0 ? expectedTotalSales / totalBudget : 0;

        return NextResponse.json({
            recommendations: normalizedRecommendations,
            summary: {
                totalCampaigns: campaigns.length,
                totalBudget,
                current: {
                    totalSpend: currentTotalSpend,
                    totalSales: currentTotalSales,
                    avgAcos: currentAvgAcos,
                    avgRoas: currentAvgRoas,
                },
                expected: {
                    totalSales: expectedTotalSales,
                    salesIncrease: estimatedSalesIncrease,
                    avgAcos: expectedAcos,
                    avgRoas: expectedRoas,
                    acosImprovement: currentAvgAcos - expectedAcos,
                    roasImprovement: expectedRoas - currentAvgRoas,
                },
            },
        });
    } catch (error) {
        console.error("Budget optimization error:", error);
        return NextResponse.json(
            { error: "Failed to calculate budget optimization" },
            { status: 500 }
        );
    }
}
