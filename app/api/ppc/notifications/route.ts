import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch user notifications
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
        const unreadOnly = searchParams.get("unreadOnly") === "true";

        // Fetch competitor alerts (reusing existing table)
        const alerts = await prisma.ppcCompetitorAlert.findMany({
            where: {
                userId: user.id,
                ...(unreadOnly ? { read: false } : {}),
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 50,
        });

        // Generate additional notifications from recent data
        const recentCampaigns = await prisma.ppcCampaign.findMany({
            where: {
                userId: user.id,
                updatedAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
                },
            },
            include: {
                metrics: {
                    orderBy: { date: "desc" },
                    take: 2,
                },
            },
        });

        const generatedNotifications = [];

        // Check for budget threshold warnings
        for (const campaign of recentCampaigns) {
            const recentSpend = campaign.metrics[0]?.spend || 0;
            const budgetUsage = (recentSpend / campaign.dailyBudget) * 100;

            if (budgetUsage > 90) {
                generatedNotifications.push({
                    id: `budget-${campaign.id}`,
                    type: "BudgetWarning",
                    severity: "High",
                    message: `Campaign "${campaign.campaignName}" has used ${budgetUsage.toFixed(1)}% of daily budget`,
                    campaignId: campaign.id,
                    campaignName: campaign.campaignName,
                    read: false,
                    createdAt: new Date(),
                });
            }

            // Check for ACOS spikes
            if (campaign.metrics.length >= 2) {
                const currentAcos = campaign.metrics[0]?.acos || 0;
                const previousAcos = campaign.metrics[1]?.acos || 0;
                const acosIncrease = ((currentAcos - previousAcos) / previousAcos) * 100;

                if (acosIncrease > 25 && currentAcos > 30) {
                    generatedNotifications.push({
                        id: `acos-${campaign.id}`,
                        type: "AcosSpike",
                        severity: "Medium",
                        message: `ACOS increased by ${acosIncrease.toFixed(1)}% to ${currentAcos.toFixed(1)}% in "${campaign.campaignName}"`,
                        campaignId: campaign.id,
                        campaignName: campaign.campaignName,
                        read: false,
                        createdAt: new Date(),
                    });
                }
            }

            // Check for conversion drops
            if (campaign.metrics.length >= 2) {
                const currentOrders = campaign.metrics[0]?.orders || 0;
                const previousOrders = campaign.metrics[1]?.orders || 0;

                if (previousOrders > 0 && currentOrders < previousOrders * 0.5) {
                    generatedNotifications.push({
                        id: `conversion-${campaign.id}`,
                        type: "ConversionDrop",
                        severity: "High",
                        message: `Conversions dropped by ${((1 - currentOrders / previousOrders) * 100).toFixed(0)}% in "${campaign.campaignName}"`,
                        campaignId: campaign.id,
                        campaignName: campaign.campaignName,
                        read: false,
                        createdAt: new Date(),
                    });
                }
            }
        }

        // Combine alerts and generated notifications
        const notifications = [
            ...alerts.map((alert) => ({
                id: alert.id,
                type: alert.alertType,
                severity: alert.severity,
                message: alert.message,
                read: alert.read,
                createdAt: alert.createdAt,
                data: alert.data,
            })),
            ...generatedNotifications,
        ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        const unreadCount = notifications.filter((n) => !n.read).length;

        return NextResponse.json({
            notifications,
            unreadCount,
        });
    } catch (error) {
        console.error("Fetch notifications error:", error);
        return NextResponse.json(
            { error: "Failed to fetch notifications" },
            { status: 500 }
        );
    }
}

// PATCH - Mark notification as read
export async function PATCH(request: Request) {
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
        const { notificationId, markAllRead } = body;

        if (markAllRead) {
            // Mark all notifications as read
            await prisma.ppcCompetitorAlert.updateMany({
                where: {
                    userId: user.id,
                    read: false,
                },
                data: {
                    read: true,
                },
            });

            return NextResponse.json({
                success: true,
                message: "All notifications marked as read",
            });
        }

        if (!notificationId) {
            return NextResponse.json(
                { error: "notificationId is required" },
                { status: 400 }
            );
        }

        // Mark single notification as read
        await prisma.ppcCompetitorAlert.updateMany({
            where: {
                id: notificationId,
                userId: user.id,
            },
            data: {
                read: true,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Notification marked as read",
        });
    } catch (error) {
        console.error("Mark notification read error:", error);
        return NextResponse.json(
            { error: "Failed to update notification" },
            { status: 500 }
        );
    }
}
