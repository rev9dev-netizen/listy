import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch competitor alerts for user
export async function GET(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status"); // active, resolved, all

        const whereClause: Record<string, unknown> = { userId };

        if (status === "active") {
            whereClause.read = false;
        } else if (status === "resolved") {
            whereClause.read = true;
        }

        const alerts = await prisma.ppcCompetitorAlert.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
            take: 100, // Limit to recent 100 alerts
        });

        return NextResponse.json({ alerts });
    } catch (error) {
        console.error("Fetch competitor alerts error:", error);
        return NextResponse.json(
            { error: "Failed to fetch competitor alerts" },
            { status: 500 }
        );
    }
}

// POST - Create a new competitor alert (for testing or manual creation)
export async function POST(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const {
            asin,
            competitorAsin,
            alertType,
            message,
            severity,
            data: alertData,
        } = body;

        if (!asin || !competitorAsin || !alertType || !message) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const alert = await prisma.ppcCompetitorAlert.create({
            data: {
                userId,
                asin,
                competitorAsin,
                alertType,
                message,
                severity: severity || "Medium",
                data: alertData || {},
                read: false,
            },
        });

        return NextResponse.json({ alert });
    } catch (error) {
        console.error("Create competitor alert error:", error);
        return NextResponse.json(
            { error: "Failed to create alert" },
            { status: 500 }
        );
    }
}
