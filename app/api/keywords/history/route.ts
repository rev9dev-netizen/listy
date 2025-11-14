import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/databse/prisma";

// GET - Fetch user's search history (last 10)
export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch search history from database
        const history = await prisma.searchHistory.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 10,
        });

        return NextResponse.json({ history });
    } catch (error) {
        console.error("Error fetching search history:", error);
        return NextResponse.json(
            { error: "Failed to fetch history" },
            { status: 500 }
        );
    }
}// POST - Save new search to history
export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { asins, marketplace, keywords, productInfo } = body;

        if (!asins || !Array.isArray(asins) || asins.length === 0) {
            return NextResponse.json(
                { error: "ASINs array is required" },
                { status: 400 }
            );
        }

        // Create new search history entry
        const searchHistory = await prisma.searchHistory.create({
            data: {
                userId,
                asins,
                marketplace,
                keywords: keywords || [],
                productInfo: productInfo || {},
            },
        });

        return NextResponse.json({ searchHistory });
    } catch (error) {
        console.error("Error saving search history:", error);
        return NextResponse.json(
            { error: "Failed to save history" },
            { status: 500 }
        );
    }
}
