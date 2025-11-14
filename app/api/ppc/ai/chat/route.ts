import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ppcChatAssistant } from "@/lib/services/ppc-ai-engine";
import { prisma } from "@/lib/prisma";

// POST - PPC Chat Assistant
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
        const { question } = body;

        if (!question) {
            return NextResponse.json({ error: "Question is required" }, { status: 400 });
        }

        // Fetch user's PPC context
        const campaigns = await prisma.ppcCampaign.findMany({
            where: { userId: user.id },
            include: {
                metrics: {
                    orderBy: { date: "desc" },
                    take: 30,
                },
                adGroups: {
                    include: {
                        keywords: {
                            take: 10,
                            orderBy: { bid: "desc" },
                        },
                    },
                },
            },
        });

        const totalSpend = campaigns.reduce((sum: number, c) => {
            return sum + c.metrics.reduce((s: number, m) => s + m.spend, 0);
        }, 0)

        const avgAcos =
            campaigns.reduce((sum, c) => {
                const campaignAcos =
                    c.metrics.reduce((s, m) => s + m.acos, 0) /
                    Math.max(c.metrics.length, 1);
                return sum + campaignAcos;
            }, 0) / Math.max(campaigns.length, 1);

        const topKeywords = campaigns
            .flatMap((c) => c.adGroups.flatMap((ag) => ag.keywords))
            .slice(0, 10)
            .map((k) => k.keyword);

        const context = {
            campaigns: campaigns.length,
            totalSpend,
            avgAcos,
            topKeywords,
            alerts: [], // TODO: Fetch recent alerts
        };

        const answer = await ppcChatAssistant(user.id, question, context);

        return NextResponse.json({ answer });
    } catch (error) {
        console.error("PPC Chat Error:", error);
        return NextResponse.json(
            { error: "Failed to process question" },
            { status: 500 }
        );
    }
}
