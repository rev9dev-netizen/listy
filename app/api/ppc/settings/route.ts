import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/databse/prisma";

// Default PPC settings
const DEFAULT_SETTINGS = {
    defaultBidStrategy: "Dynamic bids - down only",
    automationThresholds: {
        acosTarget: 30,
        pauseKeywordAcos: 60,
        pauseKeywordSpend: 100,
        budgetWarningThreshold: 90,
        bidAdjustmentPercent: 15,
    },
    cogsPercentages: {
        default: 30,
        electronics: 40,
        clothing: 25,
        books: 20,
        home: 35,
    },
    notifications: {
        emailEnabled: true,
        inAppEnabled: true,
        budgetAlerts: true,
        acosAlerts: true,
        conversionAlerts: true,
        competitorAlerts: true,
        frequency: "immediate",
    },
    marketplace: {
        default: "US",
        enabled: ["US"],
    },
};

// GET - Fetch user's PPC settings
export async function GET() {
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

        // Try to fetch existing settings from database
        let settings = await prisma.ppcSettings.findUnique({
            where: { userId: user.id },
        });        // If no settings exist, create default settings
        if (!settings) {
            settings = await prisma.ppcSettings.create({
                data: {
                    userId: user.id,
                    defaultBidStrategy: DEFAULT_SETTINGS.defaultBidStrategy,
                    automationThresholds: DEFAULT_SETTINGS.automationThresholds,
                    cogsPercentages: DEFAULT_SETTINGS.cogsPercentages,
                    notifications: DEFAULT_SETTINGS.notifications,
                    marketplace: DEFAULT_SETTINGS.marketplace,
                },
            });
        }

        // Check for API credentials (don't expose actual values)
        const apiCredentials = {
            amazonAdsConfigured: !!(
                process.env.AMAZON_ADS_CLIENT_ID &&
                process.env.AMAZON_ADS_CLIENT_SECRET &&
                process.env.AMAZON_ADS_REFRESH_TOKEN
            ),
            marketplacesConfigured: [] as string[],
        };

        // Check which marketplace profiles are configured
        const marketplaces = ["US", "UK", "DE", "FR", "ES", "IT", "CA", "MX", "JP"];
        for (const marketplace of marketplaces) {
            if (process.env[`AMAZON_ADS_PROFILE_ID_${marketplace}`]) {
                apiCredentials.marketplacesConfigured.push(marketplace);
            }
        }

        return NextResponse.json({
            ...settings,
            apiCredentials,
        });
    } catch (error) {
        console.error("Fetch settings error:", error);
        return NextResponse.json(
            { error: "Failed to fetch settings" },
            { status: 500 }
        );
    }
}

// PATCH - Update PPC settings
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
        const {
            defaultBidStrategy,
            automationThresholds,
            cogsPercentages,
            notifications,
            marketplace,
        } = body;

        // Validate automation thresholds
        if (automationThresholds) {
            if (
                automationThresholds.acosTarget < 0 ||
                automationThresholds.acosTarget > 100
            ) {
                return NextResponse.json(
                    { error: "ACOS target must be between 0 and 100" },
                    { status: 400 }
                );
            }
            if (
                automationThresholds.pauseKeywordAcos < 0 ||
                automationThresholds.pauseKeywordAcos > 100
            ) {
                return NextResponse.json(
                    { error: "Pause keyword ACOS must be between 0 and 100" },
                    { status: 400 }
                );
            }
            if (automationThresholds.pauseKeywordSpend < 0) {
                return NextResponse.json(
                    { error: "Pause keyword spend must be positive" },
                    { status: 400 }
                );
            }
        }

        // Validate COGS percentages
        if (cogsPercentages) {
            const percentages = Object.values(cogsPercentages);
            for (const percentage of percentages) {
                if (
                    typeof percentage !== "number" ||
                    percentage < 0 ||
                    percentage > 100
                ) {
                    return NextResponse.json(
                        { error: "COGS percentages must be between 0 and 100" },
                        { status: 400 }
                    );
                }
            }
        }

        // Update settings (upsert if doesn't exist)
        const updatedSettings = await prisma.ppcSettings.upsert({
            where: { userId: user.id },
            update: {
                defaultBidStrategy,
                automationThresholds,
                cogsPercentages,
                notifications,
                marketplace,
            },
            create: {
                userId: user.id,
                defaultBidStrategy: defaultBidStrategy || DEFAULT_SETTINGS.defaultBidStrategy,
                automationThresholds:
                    automationThresholds || DEFAULT_SETTINGS.automationThresholds,
                cogsPercentages: cogsPercentages || DEFAULT_SETTINGS.cogsPercentages,
                notifications: notifications || DEFAULT_SETTINGS.notifications,
                marketplace: marketplace || DEFAULT_SETTINGS.marketplace,
            },
        });

        return NextResponse.json({
            success: true,
            settings: updatedSettings,
            message: "Settings updated successfully",
        });
    } catch (error) {
        console.error("Update settings error:", error);
        return NextResponse.json(
            { error: "Failed to update settings" },
            { status: 500 }
        );
    }
}
