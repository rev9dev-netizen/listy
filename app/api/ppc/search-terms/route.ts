import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Amazon Ads API would be required for real search terms data
// This endpoint shows proper error handling when API is not configured

// GET - Fetch search terms report
export async function GET(request: Request) {
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

        // Check for Amazon Ads API credentials
        const amazonClientId = process.env.AMAZON_ADS_CLIENT_ID;
        const amazonClientSecret = process.env.AMAZON_ADS_CLIENT_SECRET;
        const amazonRefreshToken = process.env.AMAZON_ADS_REFRESH_TOKEN;

        if (!amazonClientId || !amazonClientSecret || !amazonRefreshToken) {
            return NextResponse.json(
                {
                    error: "Amazon Ads API not configured",
                    message:
                        "To use Search Terms Report, configure AMAZON_ADS_CLIENT_ID, AMAZON_ADS_CLIENT_SECRET, and AMAZON_ADS_REFRESH_TOKEN in your .env file",
                    requiresSetup: true,
                },
                { status: 503 }
            );
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
                userId: user.id,
            },
        });

        if (!campaign) {
            return NextResponse.json(
                { error: "Campaign not found" },
                { status: 404 }
            );
        }

        // TODO: Implement actual Amazon Ads API call
        // Example implementation outline:
        /*
        const accessToken = await getAmazonAdsAccessToken(
          amazonClientId,
          amazonClientSecret,
          amazonRefreshToken
        );
    
        const searchTermsResponse = await fetch(
          `https://advertising-api.amazon.com/v2/sp/targets/query`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Amazon-Advertising-API-ClientId": amazonClientId,
              "Amazon-Advertising-API-Scope": campaign.profileId,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              campaignIdFilter: {
                include: [campaign.amazonCampaignId],
              },
              metrics: [
                "impressions",
                "clicks",
                "cost",
                "purchases",
                "sales",
                "attributedConversions14d",
              ],
            }),
          }
        );
    
        const searchTermsData = await searchTermsResponse.json();
        */

        return NextResponse.json({
            error: "Amazon Ads API integration required",
            message:
                "This feature requires active Amazon Ads API integration. Please configure your API credentials in environment variables.",
            setup: {
                required: [
                    "AMAZON_ADS_CLIENT_ID",
                    "AMAZON_ADS_CLIENT_SECRET",
                    "AMAZON_ADS_REFRESH_TOKEN",
                    "AMAZON_ADS_PROFILE_ID",
                ],
                documentation:
                    "https://advertising.amazon.com/API/docs/en-us/get-started/how-to-use-api",
            },
        });
    } catch (error) {
        console.error("Search terms report error:", error);
        return NextResponse.json(
            { error: "Failed to fetch search terms" },
            { status: 500 }
        );
    }
}

// POST - Add search term as keyword or negative keyword
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
        const {
            searchTerm,
            adGroupId,
            action, // "addKeyword" or "addNegative"
            matchType = "Exact",
            bid,
        } = body;

        if (!searchTerm || !adGroupId || !action) {
            return NextResponse.json(
                { error: "searchTerm, adGroupId, and action are required" },
                { status: 400 }
            );
        }

        // Verify ad group ownership
        const adGroup = await prisma.ppcAdGroup.findFirst({
            where: {
                id: adGroupId,
                campaign: {
                    userId: user.id,
                },
            },
        });

        if (!adGroup) {
            return NextResponse.json(
                { error: "Ad group not found" },
                { status: 404 }
            );
        }

        if (action === "addKeyword") {
            // Add as regular keyword
            const keyword = await prisma.ppcKeyword.create({
                data: {
                    adGroupId,
                    keyword: searchTerm,
                    matchType,
                    bid: bid || adGroup.defaultBid,
                    status: "Active",
                },
            });

            return NextResponse.json({
                success: true,
                keyword,
                message: "Search term added as keyword",
            });
        } else if (action === "addNegative") {
            // Add as negative keyword
            const negativeKeyword = await prisma.ppcKeyword.create({
                data: {
                    adGroupId,
                    keyword: searchTerm,
                    matchType: "Negative",
                    bid: 0,
                    status: "Active",
                },
            });

            return NextResponse.json({
                success: true,
                keyword: negativeKeyword,
                message: "Search term added as negative keyword",
            });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
        console.error("Add search term error:", error);
        return NextResponse.json(
            { error: "Failed to add search term" },
            { status: 500 }
        );
    }
}
