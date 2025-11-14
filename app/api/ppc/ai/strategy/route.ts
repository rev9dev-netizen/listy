import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateCampaignStrategy } from "@/lib/services/ppc-ai-engine";

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const {
            asin,
            targetAcos,
            dailyBudget,
            targetRank,
            productData,
        } = body;

        // Validate required fields
        if (!asin || !targetAcos || !dailyBudget) {
            return NextResponse.json(
                { error: "Missing required fields: asin, targetAcos, dailyBudget" },
                { status: 400 }
            );
        }

        // Generate strategy using AI
        const strategy = await generateCampaignStrategy(
            asin,
            targetAcos,
            dailyBudget,
            targetRank,
            productData
        );

        return NextResponse.json({ strategy });
    } catch (error) {
        console.error("Failed to generate strategy:", error);
        return NextResponse.json(
            { error: "Failed to generate campaign strategy" },
            { status: 500 }
        );
    }
}
