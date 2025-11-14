/**
 * Amazon Advertising API Integration
 * Documentation: https://advertising.amazon.com/API/docs/en-us/
 */

import { cache } from "../redis";

const AMAZON_ADS_API_BASE = {
    NA: "https://advertising-api.amazon.com",
    EU: "https://advertising-api-eu.amazon.com",
    FE: "https://advertising-api-fe.amazon.com",
};

interface AmazonAdsCredentials {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    region: "NA" | "EU" | "FE";
    profileId: string;
}

// ===========================
// Authentication
// ===========================

let accessToken: string | null = null;
let tokenExpiry: number = 0;

async function getAccessToken(): Promise<string> {
    // Check if token is still valid
    if (accessToken && Date.now() < tokenExpiry) {
        return accessToken;
    }

    // Check cache
    const cachedToken = await cache.get<string>("amazon_ads_access_token");
    if (cachedToken) {
        accessToken = cachedToken;
        tokenExpiry = Date.now() + 3500 * 1000; // 3500 seconds
        return cachedToken;
    }

    // Get new token
    const credentials: AmazonAdsCredentials = {
        clientId: process.env.AMAZON_ADS_CLIENT_ID!,
        clientSecret: process.env.AMAZON_ADS_CLIENT_SECRET!,
        refreshToken: process.env.AMAZON_ADS_REFRESH_TOKEN!,
        region: (process.env.AMAZON_ADS_REGION as "NA" | "EU" | "FE") || "NA",
        profileId: process.env.AMAZON_ADS_PROFILE_ID!,
    };

    const response = await fetch("https://api.amazon.com/auth/o2/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: credentials.refreshToken,
            client_id: credentials.clientId,
            client_secret: credentials.clientSecret,
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to get Amazon Ads access token: ${response.statusText}`);
    }

    const data = await response.json();
    accessToken = data.access_token;
    tokenExpiry = Date.now() + data.expires_in * 1000;

    // Cache token
    await cache.set("amazon_ads_access_token", accessToken, data.expires_in);

    return accessToken!;
}

async function makeAmazonAdsRequest<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    body?: unknown
): Promise<T> {
    const token = await getAccessToken();
    const region = (process.env.AMAZON_ADS_REGION as "NA" | "EU" | "FE") || "NA";
    const profileId = process.env.AMAZON_ADS_PROFILE_ID!;

    const response = await fetch(`${AMAZON_ADS_API_BASE[region]}${endpoint}`, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            "Amazon-Advertising-API-ClientId": process.env.AMAZON_ADS_CLIENT_ID!,
            "Amazon-Advertising-API-Scope": profileId,
            "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        const error = await response.text();
        console.error("Amazon Ads API Error:", error);
        throw new Error(`Amazon Ads API Error: ${response.statusText}`);
    }

    return response.json();
}

// ===========================
// Campaign Management
// ===========================

export interface AmazonCampaign {
    campaignId: string;
    name: string;
    campaignType: "sponsoredProducts" | "sponsoredBrands" | "sponsoredDisplay";
    targetingType: "auto" | "manual";
    state: "enabled" | "paused" | "archived";
    dailyBudget: number;
    startDate: string;
    endDate?: string;
    premiumBidAdjustment?: boolean;
    bidding?: {
        strategy: string;
        adjustments?: {
            predicate: string;
            percentage: number;
        }[];
    };
}

export async function getCampaigns(): Promise<AmazonCampaign[]> {
    const cacheKey = "amazon_campaigns";
    const cached = await cache.get<AmazonCampaign[]>(cacheKey);
    if (cached) return cached;

    const campaigns = await makeAmazonAdsRequest<AmazonCampaign[]>(
        "/v2/sp/campaigns",
        "GET"
    );

    await cache.set(cacheKey, campaigns, 300); // Cache for 5 minutes
    return campaigns;
}

export async function createCampaign(
    campaign: Partial<AmazonCampaign>
): Promise<AmazonCampaign> {
    return makeAmazonAdsRequest<AmazonCampaign>("/v2/sp/campaigns", "POST", campaign);
}

export async function updateCampaign(
    campaignId: string,
    updates: Partial<AmazonCampaign>
): Promise<AmazonCampaign> {
    return makeAmazonAdsRequest<AmazonCampaign>(
        `/v2/sp/campaigns/${campaignId}`,
        "PUT",
        updates
    );
}

// ===========================
// Ad Groups
// ===========================

export interface AmazonAdGroup {
    adGroupId: string;
    campaignId: string;
    name: string;
    defaultBid: number;
    state: "enabled" | "paused" | "archived";
}

export async function getAdGroups(campaignId: string): Promise<AmazonAdGroup[]> {
    return makeAmazonAdsRequest<AmazonAdGroup[]>(
        `/v2/sp/adGroups?campaignIdFilter=${campaignId}`,
        "GET"
    );
}

export async function createAdGroup(
    adGroup: Partial<AmazonAdGroup>
): Promise<AmazonAdGroup> {
    return makeAmazonAdsRequest<AmazonAdGroup>("/v2/sp/adGroups", "POST", adGroup);
}

// ===========================
// Keywords
// ===========================

export interface AmazonKeyword {
    keywordId: string;
    adGroupId: string;
    campaignId: string;
    keywordText: string;
    matchType: "exact" | "phrase" | "broad";
    state: "enabled" | "paused" | "archived";
    bid: number;
}

export async function getKeywords(adGroupId?: string): Promise<AmazonKeyword[]> {
    const endpoint = adGroupId
        ? `/v2/sp/keywords?adGroupIdFilter=${adGroupId}`
        : "/v2/sp/keywords";
    return makeAmazonAdsRequest<AmazonKeyword[]>(endpoint, "GET");
}

export async function createKeyword(
    keyword: Partial<AmazonKeyword>
): Promise<AmazonKeyword> {
    return makeAmazonAdsRequest<AmazonKeyword>("/v2/sp/keywords", "POST", keyword);
}

export async function updateKeywordBid(
    keywordId: string,
    newBid: number
): Promise<AmazonKeyword> {
    return makeAmazonAdsRequest<AmazonKeyword>(
        `/v2/sp/keywords/${keywordId}`,
        "PUT",
        { bid: newBid }
    );
}

export async function pauseKeyword(keywordId: string): Promise<AmazonKeyword> {
    return makeAmazonAdsRequest<AmazonKeyword>(
        `/v2/sp/keywords/${keywordId}`,
        "PUT",
        { state: "paused" }
    );
}

// ===========================
// Performance Reports
// ===========================

export interface ReportMetrics {
    date: string;
    campaignId?: string;
    adGroupId?: string;
    keywordId?: string;
    impressions: number;
    clicks: number;
    cost: number;
    attributedSales7d: number;
    attributedUnits7d: number;
    attributedConversions7d: number;
}

export async function requestReport(
    reportType: "campaigns" | "adGroups" | "keywords",
    startDate: string,
    _endDate: string
): Promise<string> {
    // Request report generation
    const response = await makeAmazonAdsRequest<{ reportId: string }>(
        "/v2/sp/reports",
        "POST",
        {
            reportType,
            segment: "query",
            metrics: [
                "impressions",
                "clicks",
                "cost",
                "attributedSales7d",
                "attributedUnits7d",
                "attributedConversions7d",
            ],
            reportDate: startDate,
        }
    );

    return response.reportId;
}

export async function getReportStatus(
    reportId: string
): Promise<{ status: string; location?: string }> {
    return makeAmazonAdsRequest<{ status: string; location?: string }>(
        `/v2/reports/${reportId}`,
        "GET"
    );
}

export async function downloadReport(reportUrl: string): Promise<ReportMetrics[]> {
    const response = await fetch(reportUrl);
    if (!response.ok) {
        throw new Error("Failed to download report");
    }

    const data = await response.json();
    return data;
}

// ===========================
// Sync Helper
// ===========================

export async function syncCampaignData(campaignId: string): Promise<{
    campaign: AmazonCampaign;
    adGroups: AmazonAdGroup[];
    keywords: AmazonKeyword[];
}> {
    const [campaign] = await makeAmazonAdsRequest<AmazonCampaign[]>(
        `/v2/sp/campaigns?campaignIdFilter=${campaignId}`,
        "GET"
    );

    const adGroups = await getAdGroups(campaignId);

    const keywordsPromises = adGroups.map((ag) => getKeywords(ag.adGroupId));
    const keywordsResults = await Promise.all(keywordsPromises);
    const keywords = keywordsResults.flat();

    return {
        campaign,
        adGroups,
        keywords,
    };
}

// ===========================
// Budget Management
// ===========================

export async function updateCampaignBudget(
    campaignId: string,
    newBudget: number
): Promise<AmazonCampaign> {
    return makeAmazonAdsRequest<AmazonCampaign>(
        `/v2/sp/campaigns/${campaignId}`,
        "PUT",
        { dailyBudget: newBudget }
    );
}

// ===========================
// Bid Adjustments
// ===========================

export async function applyBidAdjustments(
    adjustments: { keywordId: string; newBid: number; reason: string }[]
): Promise<{ success: number; failed: number; details: unknown[] }> {
    const results = await Promise.allSettled(
        adjustments.map((adj) => updateKeywordBid(adj.keywordId, adj.newBid))
    );

    return {
        success: results.filter((r) => r.status === "fulfilled").length,
        failed: results.filter((r) => r.status === "rejected").length,
        details: results,
    };
}

// ===========================
// Mock Data for Development
// ===========================

export function getMockCampaigns(): AmazonCampaign[] {
    return [
        {
            campaignId: "campaign-001",
            name: "Auto Campaign - Discovery",
            campaignType: "sponsoredProducts",
            targetingType: "auto",
            state: "enabled",
            dailyBudget: 50,
            startDate: "2025-01-01",
        },
        {
            campaignId: "campaign-002",
            name: "Manual Campaign - Exact Match",
            campaignType: "sponsoredProducts",
            targetingType: "manual",
            state: "enabled",
            dailyBudget: 100,
            startDate: "2025-01-01",
        },
    ];
}

export function getMockKeywords(): AmazonKeyword[] {
    return [
        {
            keywordId: "kw-001",
            adGroupId: "ag-001",
            campaignId: "campaign-002",
            keywordText: "wireless charger",
            matchType: "exact",
            state: "enabled",
            bid: 1.5,
        },
        {
            keywordId: "kw-002",
            adGroupId: "ag-001",
            campaignId: "campaign-002",
            keywordText: "magsafe charger",
            matchType: "phrase",
            state: "enabled",
            bid: 1.75,
        },
    ];
}

export function getMockMetrics(): ReportMetrics[] {
    return [
        {
            date: "2025-11-13",
            keywordId: "kw-001",
            impressions: 1000,
            clicks: 50,
            cost: 75,
            attributedSales7d: 250,
            attributedUnits7d: 5,
            attributedConversions7d: 5,
        },
        {
            date: "2025-11-13",
            keywordId: "kw-002",
            impressions: 1500,
            clicks: 75,
            cost: 131.25,
            attributedSales7d: 400,
            attributedUnits7d: 8,
            attributedConversions7d: 8,
        },
    ];
}
