import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/databse/prisma";

// GET - Fetch campaigns for user
export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { searchParams } = new URL(req.url);
        const marketplace = searchParams.get("marketplace") || "US";

        const campaigns = await prisma.ppcCampaign.findMany({
            where: {
                userId: user.id,
                marketplace,
            },
            include: {
                adGroups: {
                    include: {
                        keywords: {
                            take: 10,
                        },
                    },
                },
                metrics: {
                    orderBy: { date: "desc" },
                    take: 30,
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ campaigns });
    } catch (error) {
        console.error("Error fetching campaigns:", error);
        return NextResponse.json(
            { error: "Failed to fetch campaigns" },
            { status: 500 }
        );
    }
}

// POST - Create new campaign
export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const body = await req.json();
        const {
            marketplace,
            asin,
            campaignName,
            campaignType,
            targetingType,
            dailyBudget,
            startDate,
            endDate,
        } = body;

        const campaign = await prisma.ppcCampaign.create({
            data: {
                userId: user.id,
                marketplace,
                asin,
                campaignName,
                campaignType,
                targetingType,
                dailyBudget: parseFloat(dailyBudget),
                status: "Active",
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : undefined,
            },
        });

        return NextResponse.json({ campaign });
    } catch (error) {
        console.error("Error creating campaign:", error);
        return NextResponse.json(
            { error: "Failed to create campaign" },
            { status: 500 }
        );
    }
}
