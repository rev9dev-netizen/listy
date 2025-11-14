import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/databse/prisma";
import { openai } from "@/lib/models/openai";

// POST - AI-powered negative keyword suggestions
export async function POST(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const body = await request.json();
        const { campaignId, searchTerms = [] } = body;

        if (!campaignId) {
            return NextResponse.json(
                { error: "campaignId is required" },
                { status: 400 }
            );
        }

        // Get campaign keywords to understand targeting
        const campaign = await prisma.ppcCampaign.findFirst({
            where: {
                id: campaignId,
                userId: user.id,
            },
            include: {
                adGroups: {
                    include: {
                        keywords: {
                            where: {
                                matchType: { not: "Negative" },
                            },
                        },
                    },
                },
            },
        });

        if (!campaign) {
            return NextResponse.json(
                { error: "Campaign not found" },
                { status: 404 }
            );
        }

        const targetKeywords = campaign.adGroups
            .flatMap((ag) => ag.keywords)
            .map((k) => k.keyword);

        // Use AI to suggest negative keywords
        const prompt = `You are an Amazon PPC expert. Analyze the following data and suggest negative keywords.

Campaign: ${campaign.campaignName}
Target Keywords: ${targetKeywords.join(", ")}
${searchTerms.length > 0 ? `Recent Search Terms: ${searchTerms.join(", ")}` : ""}

Suggest 10-15 negative keywords that would help filter out irrelevant traffic and improve ACOS. Focus on:
1. Completely unrelated terms
2. Low-intent searches (e.g., "how to", "diy", "free")
3. Competitor brand names
4. Wrong product categories
5. Geographic terms (if not relevant)

Return ONLY a JSON array of strings, no explanation:
["keyword1", "keyword2", ...]`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 500,
        });

        const responseText = completion.choices[0].message.content || "[]";
        let suggestions: string[] = [];

        try {
            suggestions = JSON.parse(responseText);
        } catch {
            // Extract array from markdown code blocks if needed
            const match = responseText.match(/\[[\s\S]*\]/);
            if (match) {
                suggestions = JSON.parse(match[0]);
            }
        }

        // Filter out suggestions that are too similar to target keywords
        const filteredSuggestions = suggestions.filter((suggestion) => {
            const lower = suggestion.toLowerCase();
            return !targetKeywords.some((target) =>
                target.toLowerCase().includes(lower)
            );
        });

        // Add reasoning for each suggestion
        const suggestionsWithReason = filteredSuggestions.map((keyword) => {
            let reason = "Filters irrelevant traffic";
            const lower = keyword.toLowerCase();

            if (lower.includes("how to") || lower.includes("diy")) {
                reason = "Low purchase intent - informational query";
            } else if (lower.includes("free") || lower.includes("cheap")) {
                reason = "Price-focused, likely not converting";
            } else if (lower.includes("vs") || lower.includes("review")) {
                reason = "Research phase, not ready to buy";
            } else if (lower.includes("used") || lower.includes("refurbished")) {
                reason = "Looking for different product condition";
            }

            return {
                keyword,
                reason,
                confidence: "High",
            };
        });

        return NextResponse.json({
            suggestions: suggestionsWithReason,
            campaignName: campaign.campaignName,
        });
    } catch (error) {
        console.error("AI negative keyword suggestion error:", error);
        return NextResponse.json(
            { error: "Failed to generate suggestions" },
            { status: 500 }
        );
    }
}
