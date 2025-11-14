import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/databse/prisma";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const rules = await prisma.ppcAutomationRule.findMany({
            where: { userId },
            include: {
                campaign: {
                    select: {
                        id: true,
                        campaignName: true,
                    },
                },
            },
            orderBy: {
                priority: "desc",
            },
        });

        return NextResponse.json({ rules });
    } catch (error) {
        console.error("Failed to fetch automation rules:", error);
        return NextResponse.json(
            { error: "Failed to fetch automation rules" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const {
            name,
            type,
            conditions,
            actions,
            campaignId,
            priority,
            isActive,
        } = body;

        // Validate required fields
        if (!name || !type || !conditions || !actions) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // If campaignId is provided, verify it belongs to user
        if (campaignId) {
            const campaign = await prisma.ppcCampaign.findFirst({
                where: {
                    id: campaignId,
                    userId,
                },
            });

            if (!campaign) {
                return NextResponse.json(
                    { error: "Campaign not found" },
                    { status: 404 }
                );
            }
        }

        // Create automation rule
        const rule = await prisma.ppcAutomationRule.create({
            data: {
                name,
                type,
                conditions,
                actions,
                isActive: isActive !== false,
                priority: priority || 5,
                userId,
                campaignId: campaignId || null,
            },
            include: {
                campaign: {
                    select: {
                        id: true,
                        campaignName: true,
                    },
                },
            },
        });

        return NextResponse.json({ rule });
    } catch (error) {
        console.error("Failed to create automation rule:", error);
        return NextResponse.json(
            { error: "Failed to create automation rule" },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { id, isActive } = body;

        if (!id) {
            return NextResponse.json({ error: "Missing rule ID" }, { status: 400 });
        }

        // Verify rule belongs to user
        const existingRule = await prisma.ppcAutomationRule.findFirst({
            where: {
                id,
                userId,
            },
        });

        if (!existingRule) {
            return NextResponse.json({ error: "Rule not found" }, { status: 404 });
        }

        // Toggle isActive status
        const rule = await prisma.ppcAutomationRule.update({
            where: { id },
            data: {
                isActive: isActive !== undefined ? isActive : !existingRule.isActive,
                lastRun: isActive === false ? null : undefined,
            },
            include: {
                campaign: {
                    select: {
                        id: true,
                        campaignName: true,
                    },
                },
            },
        });

        return NextResponse.json({ rule });
    } catch (error) {
        console.error("Failed to update automation rule:", error);
        return NextResponse.json(
            { error: "Failed to update automation rule" },
            { status: 500 }
        );
    }
}
