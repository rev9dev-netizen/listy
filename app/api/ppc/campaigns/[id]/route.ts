import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/databse/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const campaign = await prisma.ppcCampaign.findFirst({
            where: { id, userId },
            include: {
                adGroups: {
                    include: {
                        _count: {
                            select: { keywords: true, targets: true },
                        },
                    },
                },
                metrics: {
                    where: {
                        date: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                        },
                    },
                    orderBy: { date: "desc" },
                },
            },
        });

        if (!campaign) {
            return NextResponse.json(
                { error: "Campaign not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ campaign });
    } catch (error) {
        console.error("Failed to fetch campaign:", error);
        return NextResponse.json(
            { error: "Failed to fetch campaign" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { status, dailyBudget, targetAcos, endDate } = body;

        // Verify ownership
        const existingCampaign = await prisma.ppcCampaign.findFirst({
            where: { id, userId },
        });

        if (!existingCampaign) {
            return NextResponse.json(
                { error: "Campaign not found" },
                { status: 404 }
            );
        }

        // Build update data object
        const updateData: {
            status?: string;
            dailyBudget?: number;
            targetAcos?: number;
            endDate?: Date | null;
            updatedAt: Date;
        } = {
            updatedAt: new Date(),
        };

        if (status !== undefined) {
            updateData.status = status;
        }

        if (dailyBudget !== undefined) {
            updateData.dailyBudget = parseFloat(dailyBudget);
        }

        if (targetAcos !== undefined) {
            updateData.targetAcos = parseFloat(targetAcos);
        }

        if (endDate !== undefined) {
            updateData.endDate = endDate ? new Date(endDate) : null;
        }

        const updatedCampaign = await prisma.ppcCampaign.update({
            where: { id },
            data: updateData,
            include: {
                adGroups: {
                    include: {
                        _count: {
                            select: { keywords: true, targets: true },
                        },
                    },
                },
                metrics: {
                    where: {
                        date: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                        },
                    },
                    orderBy: { date: "desc" },
                },
            },
        });

        return NextResponse.json({ campaign: updatedCampaign });
    } catch (error) {
        console.error("Failed to update campaign:", error);
        return NextResponse.json(
            { error: "Failed to update campaign" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Verify ownership
        const existingCampaign = await prisma.ppcCampaign.findFirst({
            where: { id, userId },
        });

        if (!existingCampaign) {
            return NextResponse.json(
                { error: "Campaign not found" },
                { status: 404 }
            );
        }

        await prisma.ppcCampaign.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete campaign:", error);
        return NextResponse.json(
            { error: "Failed to delete campaign" },
            { status: 500 }
        );
    }
}
