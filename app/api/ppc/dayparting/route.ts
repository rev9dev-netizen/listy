import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch dayparting schedule for a campaign
export async function GET(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const campaignId = searchParams.get("campaignId");

        if (!campaignId) {
            return NextResponse.json(
                { error: "campaignId is required" },
                { status: 400 }
            );
        }

        // Verify campaign ownership
        const campaign = await prisma.ppcCampaign.findFirst({
            where: {
                id: campaignId,
            },
        });

        if (!campaign) {
            return NextResponse.json(
                { error: "Campaign not found" },
                { status: 404 }
            );
        }

        // Fetch dayparting schedules
        const schedules = await prisma.ppcDaypartingSchedule.findMany({
            where: {
                campaignId,
            },
            orderBy: [{ dayOfWeek: "asc" }, { hour: "asc" }],
        });

        return NextResponse.json({ schedules });
    } catch (error) {
        console.error("Fetch dayparting schedules error:", error);
        return NextResponse.json(
            { error: "Failed to fetch dayparting schedules" },
            { status: 500 }
        );
    }
}

// POST - Create or update dayparting schedules
export async function POST(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { campaignId, schedules } = body;

        if (!campaignId || !schedules || !Array.isArray(schedules)) {
            return NextResponse.json(
                { error: "campaignId and schedules array are required" },
                { status: 400 }
            );
        }

        // Verify campaign ownership
        const campaign = await prisma.ppcCampaign.findFirst({
            where: {
                id: campaignId,
            },
        });

        if (!campaign) {
            return NextResponse.json(
                { error: "Campaign not found" },
                { status: 404 }
            );
        }

        // Delete existing schedules for this campaign
        await prisma.ppcDaypartingSchedule.deleteMany({
            where: { campaignId },
        });

        // Create new schedules
        const createdSchedules = await prisma.ppcDaypartingSchedule.createMany({
            data: schedules.map((schedule: { dayOfWeek: number; hour: number; bidMultiplier: number }) => ({
                campaignId,
                dayOfWeek: schedule.dayOfWeek,
                hour: schedule.hour,
                bidModifier: schedule.bidMultiplier,
            })),
        });

        return NextResponse.json({
            message: `Successfully created ${createdSchedules.count} dayparting schedules`,
            count: createdSchedules.count,
        });
    } catch (error) {
        console.error("Create dayparting schedules error:", error);
        return NextResponse.json(
            { error: "Failed to create dayparting schedules" },
            { status: 500 }
        );
    }
}
