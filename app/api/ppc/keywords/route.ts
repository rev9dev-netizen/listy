import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const adGroupId = searchParams.get("adGroupId");
        const campaignId = searchParams.get("campaignId");

        const where: { adGroup: { campaign: { userId: string; id?: string } }; adGroupId?: string } = { adGroup: { campaign: { userId } } };
        if (campaignId) { where.adGroup.campaign.id = campaignId; }
        if (adGroupId) { where.adGroupId = adGroupId; }

        const keywords = await prisma.ppcKeyword.findMany({ where, include: { adGroup: { include: { campaign: { select: { id: true, campaignName: true } } } }, metrics: { where: { date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }, orderBy: { date: "desc" } }, bidHistory: { orderBy: { createdAt: "desc" }, take: 5 } }, orderBy: { createdAt: "desc" } });
        return NextResponse.json({ keywords });
    } catch (error) {
        console.error("Failed to fetch keywords:", error);
        return NextResponse.json({ error: "Failed to fetch keywords" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

        const body = await request.json();
        const { adGroupId, keyword, matchType, bid } = body;
        if (!adGroupId || !keyword || !matchType || !bid) { return NextResponse.json({ error: "Missing required fields" }, { status: 400 }); }

        const adGroup = await prisma.ppcAdGroup.findFirst({ where: { id: adGroupId, campaign: { userId } } });
        if (!adGroup) { return NextResponse.json({ error: "Ad group not found" }, { status: 404 }); }

        const newKeywordRecord = await prisma.ppcKeyword.create({ data: { keyword, matchType, bid, status: "Active", adGroupId }, include: { adGroup: { include: { campaign: true } } } });
        return NextResponse.json({ keyword: newKeywordRecord });
    } catch (error) {
        console.error("Failed to create keyword:", error);
        return NextResponse.json({ error: "Failed to create keyword" }, { status: 500 });
    }
}