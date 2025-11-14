import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ppcChatAssistant } from "@/lib/services/ppc-ai-engine";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

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

    // Strongly-typed campaign payload from Prisma
    type CampaignWithRelations = Prisma.PpcCampaignGetPayload<{
      include: {
        metrics: true;
        adGroups: { include: { keywords: true } };
      };
    }>;

    const campaigns: CampaignWithRelations[] = await prisma.ppcCampaign.findMany({
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

    // totalSpend: safely handle possibly-missing spend values
    const totalSpend: number = campaigns.reduce((sum: number, c) => {
      const campaignSpend = c.metrics.reduce((s: number, m) => s + (m.spend ?? 0), 0);
      return sum + campaignSpend;
    }, 0);

    // avgAcos: average acos per campaign, then average across campaigns
    const avgAcos: number =
      campaigns.reduce((sum: number, c) => {
        const campaignAcos =
          c.metrics.reduce((s: number, m) => s + (m.acos ?? 0), 0) / Math.max(c.metrics.length, 1);
        return sum + campaignAcos;
      }, 0) / Math.max(campaigns.length, 1);

    const topKeywords: string[] = campaigns
      .flatMap((c) => c.adGroups.flatMap((ag) => ag.keywords))
      .slice(0, 10)
      .map((k) => k.keyword ?? "");

    const context = {
      campaigns: campaigns.length,
      totalSpend,
      avgAcos,
      topKeywords,
      alerts: [] as string[], // TODO: Fetch recent alerts
    };

    const answer = await ppcChatAssistant(user.id, question, context);

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("PPC Chat Error:", error);
    return NextResponse.json({ error: "Failed to process question" }, { status: 500 });
  }
}
