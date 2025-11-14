import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/databse/prisma";

// Helper to convert data to CSV format
function toCSV(data: Record<string, unknown>[]): string {
    if (data.length === 0) return "";

    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(","),
        ...data.map((row) =>
            headers
                .map((header) => {
                    const value = row[header];
                    const stringValue = value?.toString() || "";
                    // Escape commas and quotes
                    return stringValue.includes(",") || stringValue.includes('"')
                        ? `"${stringValue.replace(/"/g, '""')}"`
                        : stringValue;
                })
                .join(",")
        ),
    ];

    return csvRows.join("\n");
}

// POST - Export data
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
        const {
            exportType, // "campaigns", "keywords", "metrics"
            format, // "csv", "json"
            dateRange, // { start: Date, end: Date }
            campaignIds = [],
            includeMetrics = true,
        } = body;

        if (!exportType) {
            return NextResponse.json(
                { error: "exportType is required" },
                { status: 400 }
            );
        }

        let data: Record<string, unknown>[] = [];
        let filename = "";

        // Date range filter
        const dateFilter = dateRange
            ? {
                createdAt: {
                    gte: new Date(dateRange.start),
                    lte: new Date(dateRange.end),
                },
            }
            : {};

        switch (exportType) {
            case "campaigns": {
                const campaigns = await prisma.ppcCampaign.findMany({
                    where: {
                        userId: user.id,
                        ...(campaignIds.length > 0 ? { id: { in: campaignIds } } : {}),
                        ...dateFilter,
                    },
                    include: {
                        metrics: includeMetrics
                            ? {
                                orderBy: { date: "desc" },
                                take: 30,
                            }
                            : false,
                        adGroups: {
                            include: {
                                keywords: true,
                            },
                        },
                    },
                });

                data = campaigns.map((campaign) => {
                    const totalSpend = campaign.metrics?.reduce(
                        (sum, m) => sum + m.spend,
                        0
                    ) || 0;
                    const totalSales = campaign.metrics?.reduce(
                        (sum, m) => sum + m.sales,
                        0
                    ) || 0;
                    const avgAcos =
                        totalSales > 0 ? (totalSpend / totalSales) * 100 : 0;

                    return {
                        campaignId: campaign.id,
                        campaignName: campaign.campaignName,
                        campaignType: campaign.campaignType,
                        targetingType: campaign.targetingType,
                        status: campaign.status,
                        dailyBudget: campaign.dailyBudget,
                        marketplace: campaign.marketplace,
                        asin: campaign.asin,
                        totalAdGroups: campaign.adGroups.length,
                        totalKeywords: campaign.adGroups.reduce(
                            (sum, ag) => sum + ag.keywords.length,
                            0
                        ),
                        totalSpend: totalSpend.toFixed(2),
                        totalSales: totalSales.toFixed(2),
                        avgAcos: avgAcos.toFixed(2),
                        startDate: campaign.startDate.toISOString(),
                        createdAt: campaign.createdAt.toISOString(),
                    };
                });

                filename = `campaigns_export_${new Date().toISOString().split("T")[0]}`;
                break;
            }

            case "keywords": {
                const keywords = await prisma.ppcKeyword.findMany({
                    where: {
                        adGroup: {
                            campaign: {
                                userId: user.id,
                                ...(campaignIds.length > 0 ? { id: { in: campaignIds } } : {}),
                            },
                        },
                        ...dateFilter,
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
                        metrics: includeMetrics
                            ? {
                                orderBy: { date: "desc" },
                                take: 30,
                            }
                            : false,
                    },
                });

                data = keywords.map((keyword) => {
                    const totalSpend = keyword.metrics?.reduce(
                        (sum, m) => sum + m.spend,
                        0
                    ) || 0;
                    const totalSales = keyword.metrics?.reduce(
                        (sum, m) => sum + m.sales,
                        0
                    ) || 0;
                    const totalClicks = keyword.metrics?.reduce(
                        (sum, m) => sum + m.clicks,
                        0
                    ) || 0;
                    const totalImpressions = keyword.metrics?.reduce(
                        (sum, m) => sum + m.impressions,
                        0
                    ) || 0;
                    const totalOrders = keyword.metrics?.reduce(
                        (sum, m) => sum + m.orders,
                        0
                    ) || 0;

                    return {
                        keywordId: keyword.id,
                        keyword: keyword.keyword,
                        matchType: keyword.matchType,
                        bid: keyword.bid,
                        status: keyword.status,
                        campaign: keyword.adGroup.campaign.campaignName,
                        adGroup: keyword.adGroup.name,
                        impressions: totalImpressions,
                        clicks: totalClicks,
                        orders: totalOrders,
                        spend: totalSpend.toFixed(2),
                        sales: totalSales.toFixed(2),
                        ctr:
                            totalImpressions > 0
                                ? ((totalClicks / totalImpressions) * 100).toFixed(2)
                                : "0.00",
                        cpc:
                            totalClicks > 0 ? (totalSpend / totalClicks).toFixed(2) : "0.00",
                        acos:
                            totalSales > 0
                                ? ((totalSpend / totalSales) * 100).toFixed(2)
                                : "0.00",
                        conversionRate:
                            totalClicks > 0
                                ? ((totalOrders / totalClicks) * 100).toFixed(2)
                                : "0.00",
                        qualityScore: keyword.qualityScore || 0,
                        lifecycle: keyword.lifecycle || "Discovery",
                        createdAt: keyword.createdAt.toISOString(),
                    };
                });

                filename = `keywords_export_${new Date().toISOString().split("T")[0]}`;
                break;
            }

            case "metrics": {
                const metrics = await prisma.ppcCampaignMetric.findMany({
                    where: {
                        campaign: {
                            userId: user.id,
                            ...(campaignIds.length > 0 ? { id: { in: campaignIds } } : {}),
                        },
                        ...(dateRange
                            ? {
                                date: {
                                    gte: new Date(dateRange.start),
                                    lte: new Date(dateRange.end),
                                },
                            }
                            : {}),
                    },
                    include: {
                        campaign: {
                            select: {
                                id: true,
                                campaignName: true,
                            },
                        },
                    },
                    orderBy: {
                        date: "desc",
                    },
                });

                data = metrics.map((metric) => ({
                    date: metric.date.toISOString().split("T")[0],
                    campaign: metric.campaign.campaignName,
                    impressions: metric.impressions,
                    clicks: metric.clicks,
                    orders: metric.orders,
                    spend: metric.spend.toFixed(2),
                    sales: metric.sales.toFixed(2),
                    ctr: metric.ctr.toFixed(2),
                    cpc: metric.cpc.toFixed(2),
                    acos: metric.acos.toFixed(2),
                    roas: metric.roas.toFixed(2),
                    conversionRate: metric.conversionRate.toFixed(2),
                }));

                filename = `metrics_export_${new Date().toISOString().split("T")[0]}`;
                break;
            }

            default:
                return NextResponse.json(
                    { error: "Invalid export type" },
                    { status: 400 }
                );
        }

        // Format response based on requested format
        if (format === "csv") {
            const csv = toCSV(data);
            return new NextResponse(csv, {
                headers: {
                    "Content-Type": "text/csv",
                    "Content-Disposition": `attachment; filename="${filename}.csv"`,
                },
            });
        } else {
            // Default to JSON
            return NextResponse.json({
                success: true,
                data,
                count: data.length,
                exportedAt: new Date().toISOString(),
            });
        }
    } catch (error) {
        console.error("Export error:", error);
        return NextResponse.json(
            { error: "Failed to export data" },
            { status: 500 }
        );
    }
}
