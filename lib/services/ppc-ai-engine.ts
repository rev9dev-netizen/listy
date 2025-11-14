import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// ===========================
// AI Keyword Quality Scoring
// ===========================

interface KeywordMetrics {
    keyword: string;
    impressions: number;
    clicks: number;
    spend: number;
    sales: number;
    orders: number;
    ctr: number;
    cpc: number;
    acos: number;
    conversionRate: number;
}

interface KeywordQualityScore {
    overallScore: number; // 0-100
    profitability: number; // 0-1
    conversionProbability: number; // 0-1
    competitionLevel: number; // 0-1
    trendingScore: number; // 0-1
    recommendation: string;
    lifecycle: "Discovery" | "Growth" | "Maturity" | "Decline";
}

export async function calculateKeywordQualityScore(
    keyword: string,
    metrics: KeywordMetrics,
    historicalMetrics: KeywordMetrics[],
    profitMargin: number
): Promise<KeywordQualityScore> {
    // Calculate profitability score
    const profitability = calculateProfitability(metrics, profitMargin);

    // Calculate conversion probability
    const conversionProb = calculateConversionProbability(metrics, historicalMetrics);

    // Calculate competition level
    const competition = calculateCompetitionLevel(metrics);

    // Calculate trending score
    const trendingScore = calculateTrendingScore(historicalMetrics);

    // Calculate overall score
    const overallScore =
        profitability * 35 +
        conversionProb * 30 +
        (1 - competition) * 20 +
        trendingScore * 15;

    // Determine lifecycle
    const lifecycle = determineLifecycle(historicalMetrics);

    // Generate recommendation
    const recommendation = generateRecommendation({
        overallScore,
        profitability,
        conversionProb,
        competition,
        trendingScore,
        lifecycle,
    });

    return {
        overallScore: Math.round(overallScore),
        profitability,
        conversionProbability: conversionProb,
        competitionLevel: competition,
        trendingScore,
        recommendation,
        lifecycle,
    };
}

function calculateProfitability(
    metrics: KeywordMetrics,
    profitMargin: number
): number {
    if (metrics.sales === 0) return 0;

    const profit = metrics.sales * profitMargin - metrics.spend;
    const profitScore = profit / metrics.sales;

    return Math.max(0, Math.min(1, (profitScore + 0.5) / 1.5));
}

function calculateConversionProbability(
    metrics: KeywordMetrics,
    historical: KeywordMetrics[]
): number {
    if (historical.length < 3) return metrics.conversionRate / 100;

    const avgConversion =
        historical.reduce((sum, m) => sum + m.conversionRate, 0) / historical.length;

    const trend = metrics.conversionRate - avgConversion;
    const stabilityBonus = trend > 0 ? 0.1 : 0;

    return Math.max(0, Math.min(1, metrics.conversionRate / 100 + stabilityBonus));
}

function calculateCompetitionLevel(metrics: KeywordMetrics): number {
    // Higher CPC and lower CTR indicate higher competition
    const cpcFactor = Math.min(metrics.cpc / 5, 1); // Normalize CPC
    const ctrFactor = Math.max(0, 1 - metrics.ctr / 2); // Lower CTR = more competition

    return (cpcFactor * 0.6 + ctrFactor * 0.4);
}

function calculateTrendingScore(historical: KeywordMetrics[]): number {
    if (historical.length < 7) return 0.5;

    const recentWeek = historical.slice(-7);
    const previousWeek = historical.slice(-14, -7);

    if (previousWeek.length === 0) return 0.5;

    const recentImpressions = recentWeek.reduce((sum, m) => sum + m.impressions, 0);
    const prevImpressions = previousWeek.reduce((sum, m) => sum + m.impressions, 0);

    if (prevImpressions === 0) return 0.5;

    const growth = (recentImpressions - prevImpressions) / prevImpressions;

    return Math.max(0, Math.min(1, 0.5 + growth));
}

function determineLifecycle(
    historical: KeywordMetrics[]
): "Discovery" | "Growth" | "Maturity" | "Decline" {
    if (historical.length < 14) return "Discovery";

    const recent = historical.slice(-7);
    const previous = historical.slice(-14, -7);

    const recentPerf =
        recent.reduce((sum, m) => sum + m.impressions + m.clicks * 10, 0) / recent.length;
    const prevPerf =
        previous.reduce((sum, m) => sum + m.impressions + m.clicks * 10, 0) /
        previous.length;

    if (prevPerf === 0) return "Discovery";

    const growth = (recentPerf - prevPerf) / prevPerf;

    if (growth > 0.2) return "Growth";
    if (growth < -0.2) return "Decline";
    return "Maturity";
}

function generateRecommendation(scores: {
    overallScore: number;
    profitability: number;
    conversionProb: number;
    competition: number;
    trendingScore: number;
    lifecycle: string;
}): string {
    if (scores.overallScore >= 80) {
        return "🟢 Excellent keyword! Scale aggressively.";
    } else if (scores.overallScore >= 60) {
        if (scores.profitability < 0.4) {
            return "🟡 Good keyword but watch profitability. Consider lowering bid.";
        }
        return "🟢 Good keyword. Maintain or increase bid.";
    } else if (scores.overallScore >= 40) {
        if (scores.competition > 0.7) {
            return "🟡 High competition. Consider alternative keywords.";
        }
        return "🟡 Moderate performer. Monitor closely.";
    } else {
        if (scores.lifecycle === "Decline") {
            return "🔴 Declining keyword. Consider pausing.";
        }
        return "🔴 Poor performer. Reduce bid or pause.";
    }
}

// ===========================
// AI Bid Prediction
// ===========================

interface BidPrediction {
    predictedCPC: number;
    predictedClicks: number;
    predictedSales: number;
    predictedAcos: number;
    recommendedBid: number;
    confidence: number;
    reasoning: string;
}

export async function predictOptimalBid(
    keyword: string,
    currentBid: number,
    metrics: KeywordMetrics[],
    targetAcos: number,
    profitMargin: number
): Promise<BidPrediction> {
    const prompt = `You are an Amazon PPC expert. Analyze this keyword and predict optimal bidding.

Keyword: "${keyword}"
Current Bid: $${currentBid}
Target ACOS: ${targetAcos}%
Profit Margin: ${profitMargin * 100}%

Recent Performance (last 30 days):
${metrics
            .slice(-30)
            .map(
                (m, i) =>
                    `Day ${i + 1}: CPC=$${m.cpc.toFixed(2)}, CTR=${m.ctr.toFixed(2)}%, Conv=${m.conversionRate.toFixed(2)}%, ACOS=${m.acos.toFixed(2)}%`
            )
            .join("\n")}

Provide predictions in JSON format:
{
  "predictedCPC": <number>,
  "predictedClicks": <number>,
  "predictedSales": <number>,
  "predictedAcos": <number>,
  "recommendedBid": <number>,
  "confidence": <0-1>,
  "reasoning": "<explanation>"
}`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content:
                        "You are an expert Amazon PPC analyst. Provide data-driven predictions based on historical performance.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.3,
            response_format: { type: "json_object" },
        });

        const prediction = JSON.parse(
            response.choices[0].message.content || "{}"
        ) as BidPrediction;

        return prediction;
    } catch (error) {
        console.error("AI Bid Prediction Error:", error);
        // Fallback to simple calculation
        return calculateSimpleBidPrediction(currentBid, metrics, targetAcos);
    }
}

function calculateSimpleBidPrediction(
    currentBid: number,
    metrics: KeywordMetrics[],
    targetAcos: number
): BidPrediction {
    const avgMetrics = metrics.slice(-30).reduce(
        (acc, m) => ({
            cpc: acc.cpc + m.cpc / 30,
            ctr: acc.ctr + m.ctr / 30,
            conversionRate: acc.conversionRate + m.conversionRate / 30,
            acos: acc.acos + m.acos / 30,
        }),
        { cpc: 0, ctr: 0, conversionRate: 0, acos: 0 }
    );

    const bidAdjustment = targetAcos / avgMetrics.acos;
    const recommendedBid = currentBid * Math.min(Math.max(bidAdjustment, 0.5), 1.5);

    return {
        predictedCPC: avgMetrics.cpc,
        predictedClicks: Math.round((avgMetrics.ctr / 100) * 1000),
        predictedSales: 0,
        predictedAcos: avgMetrics.acos,
        recommendedBid: Math.round(recommendedBid * 100) / 100,
        confidence: 0.6,
        reasoning:
            "Based on 30-day average performance. Actual AI prediction unavailable.",
    };
}

// ===========================
// AI PPC Chat Assistant
// ===========================

export async function ppcChatAssistant(
    userId: string,
    question: string,
    context: {
        campaigns: number;
        totalSpend: number;
        avgAcos: number;
        topKeywords: string[];
        alerts: string[];
    }
): Promise<string> {
    const prompt = `You are an expert Amazon PPC consultant. Answer the user's question based on their campaign data.

User's PPC Data:
- Total Campaigns: ${context.campaigns}
- Total Spend (30 days): $${context.totalSpend.toFixed(2)}
- Average ACOS: ${context.avgAcos.toFixed(2)}%
- Top Keywords: ${context.topKeywords.join(", ")}
- Recent Alerts: ${context.alerts.join("; ")}

User Question: "${question}"

Provide actionable, specific advice. Be concise but helpful.`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content:
                        "You are an Amazon PPC expert. Provide clear, actionable advice based on data.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 500,
        });

        return response.choices[0].message.content || "I couldn't generate a response. Please try again.";
    } catch (error) {
        console.error("PPC Chat Assistant Error:", error);
        return "I'm having trouble analyzing your data right now. Please try again later.";
    }
}

// ===========================
// AI Campaign Strategy Generator
// ===========================

interface CampaignStrategy {
    campaignStructure: {
        name: string;
        type: string;
        targetingType: string;
        dailyBudget: number;
        adGroups: {
            name: string;
            keywords: { keyword: string; matchType: string; bid: number }[];
        }[];
    }[];
    negativeKeywords: string[];
    estimatedResults: {
        estimatedClicks: number;
        estimatedSpend: number;
        estimatedSales: number;
        estimatedAcos: number;
    };
    reasoning: string;
}

export async function generateCampaignStrategy(
    asin: string,
    targetAcos: number,
    monthlyBudget: number,
    rankGoal: string,
    productData: {
        title: string;
        price: number;
        category: string;
        keywords: string[];
    }
): Promise<CampaignStrategy> {
    const prompt = `Generate a complete Amazon PPC campaign strategy.

Product ASIN: ${asin}
Product: ${productData.title}
Price: $${productData.price}
Category: ${productData.category}
Target ACOS: ${targetAcos}%
Monthly Budget: $${monthlyBudget}
Rank Goal: ${rankGoal}

Available Keywords: ${productData.keywords.join(", ")}

Create a campaign structure with:
1. Auto campaign for discovery
2. Manual campaigns (Broad, Phrase, Exact match)
3. Suggested bids based on price and target ACOS
4. Negative keywords to exclude
5. Budget allocation across campaigns

Respond in JSON format with the CampaignStrategy structure.`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content:
                        "You are an Amazon PPC strategist. Create optimized campaign structures.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.4,
            response_format: { type: "json_object" },
        });

        return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
        console.error("Campaign Strategy Generation Error:", error);
        throw new Error("Failed to generate campaign strategy");
    }
}
