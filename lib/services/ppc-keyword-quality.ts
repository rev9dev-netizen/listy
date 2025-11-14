/**
 * PPC Keyword Quality Score Service
 * Calculates composite quality scores (0-100) based on multiple factors
 */

interface KeywordMetrics {
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    sales: number;
    ctr: number;
    conversionRate: number;
    acos: number;
}

interface QualityScoreResult {
    score: number;
    breakdown: {
        conversionScore: number;
        profitabilityScore: number;
        efficiencyScore: number;
        volumeScore: number;
        trendScore: number;
    };
    recommendation: string;
}

/**
 * Calculate conversion score (0-100)
 * Based on conversion rate and number of conversions
 */
function calculateConversionScore(metrics: KeywordMetrics): number {
    const { conversionRate, conversions } = metrics;

    // Conversion rate scoring (0-15%)
    const conversionRateScore = Math.min((conversionRate / 15) * 50, 50);

    // Absolute conversions scoring (volume matters)
    const conversionsScore = Math.min((conversions / 20) * 50, 50);

    return conversionRateScore + conversionsScore;
}

/**
 * Calculate profitability score (0-100)
 * Based on ACOS and net profit margin
 */
function calculateProfitabilityScore(metrics: KeywordMetrics): number {
    const { acos, sales, spend } = metrics;

    // ACOS scoring (lower is better)
    let acosScore = 0;
    if (acos <= 20) acosScore = 100;
    else if (acos <= 30) acosScore = 80;
    else if (acos <= 40) acosScore = 60;
    else if (acos <= 50) acosScore = 40;
    else if (acos <= 70) acosScore = 20;
    else acosScore = 10;

    // ROAS scoring (revenue / spend)
    const roas = spend > 0 ? sales / spend : 0;
    const roasScore = Math.min(roas * 20, 100); // 5x ROAS = 100 score

    return (acosScore * 0.6 + roasScore * 0.4);
}

/**
 * Calculate efficiency score (0-100)
 * Based on CTR and CPC effectiveness
 */
function calculateEfficiencyScore(metrics: KeywordMetrics): number {
    const { ctr, clicks, spend } = metrics;

    // CTR scoring (higher is better)
    const ctrScore = Math.min((ctr / 3) * 100, 100); // 3% CTR = 100 score

    // CPC efficiency (clicks per dollar spent)
    const cpc = clicks > 0 ? spend / clicks : 0;
    const cpcScore = cpc > 0 ? Math.max(0, 100 - cpc * 20) : 50; // Lower CPC = higher score

    return (ctrScore * 0.6 + cpcScore * 0.4);
}

/**
 * Calculate volume score (0-100)
 * Based on impressions and clicks volume
 */
function calculateVolumeScore(metrics: KeywordMetrics): number {
    const { impressions, clicks } = metrics;

    // Impressions scoring (shows search volume)
    const impressionsScore = Math.min((impressions / 1000) * 50, 50);

    // Clicks scoring (shows engagement)
    const clicksScore = Math.min((clicks / 100) * 50, 50);

    return impressionsScore + clicksScore;
}

/**
 * Calculate trend score (0-100)
 * Based on performance trajectory (simplified - would need historical data)
 */
function calculateTrendScore(metrics: KeywordMetrics): number {
    const { conversionRate, ctr, acos } = metrics;

    // Positive indicators
    const positiveScore =
        (conversionRate > 5 ? 30 : 0) +
        (ctr > 1 ? 30 : 0) +
        (acos < 30 ? 40 : 0);

    return Math.min(positiveScore, 100);
}

/**
 * Generate recommendation based on score breakdown
 */
function generateRecommendation(breakdown: QualityScoreResult['breakdown'], totalScore: number): string {
    const { conversionScore, profitabilityScore, efficiencyScore, volumeScore } = breakdown;

    if (totalScore >= 80) {
        return "Excellent performer! Consider increasing bid to capture more traffic.";
    }

    if (totalScore >= 60) {
        return "Good keyword. Monitor performance and optimize bid as needed.";
    }

    const weakPoints: string[] = [];
    if (conversionScore < 40) weakPoints.push("conversions");
    if (profitabilityScore < 40) weakPoints.push("profitability (high ACOS)");
    if (efficiencyScore < 40) weakPoints.push("efficiency (low CTR)");
    if (volumeScore < 40) weakPoints.push("volume");

    if (weakPoints.length > 0) {
        return `Needs improvement in: ${weakPoints.join(", ")}. Consider ${profitabilityScore < 40 ? "reducing bid" : "optimization"}.`;
    }

    if (totalScore < 30) {
        return "Poor performer. Consider pausing or significantly reducing bid.";
    }

    return "Monitor performance and adjust bid based on goals.";
}

/**
 * Main function to calculate keyword quality score
 */
export function calculateKeywordQualityScore(metrics: KeywordMetrics): QualityScoreResult {
    // Calculate individual component scores
    const conversionScore = calculateConversionScore(metrics);
    const profitabilityScore = calculateProfitabilityScore(metrics);
    const efficiencyScore = calculateEfficiencyScore(metrics);
    const volumeScore = calculateVolumeScore(metrics);
    const trendScore = calculateTrendScore(metrics);

    // Weighted composite score
    const totalScore = Math.round(
        conversionScore * 0.30 +      // 30% weight on conversions
        profitabilityScore * 0.30 +   // 30% weight on profitability
        efficiencyScore * 0.20 +      // 20% weight on efficiency
        volumeScore * 0.10 +          // 10% weight on volume
        trendScore * 0.10             // 10% weight on trend
    );

    const breakdown = {
        conversionScore: Math.round(conversionScore),
        profitabilityScore: Math.round(profitabilityScore),
        efficiencyScore: Math.round(efficiencyScore),
        volumeScore: Math.round(volumeScore),
        trendScore: Math.round(trendScore),
    };

    const recommendation = generateRecommendation(breakdown, totalScore);

    return {
        score: Math.min(Math.max(totalScore, 0), 100),
        breakdown,
        recommendation,
    };
}

/**
 * Classify keyword lifecycle based on age and performance
 */
export type KeywordLifecycle = "DISCOVERY" | "GROWTH" | "MATURITY" | "DECLINE";

export function detectKeywordLifecycle(
    createdAt: Date,
    metrics: KeywordMetrics,
    qualityScore: number
): KeywordLifecycle {
    const ageInDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const { conversions, clicks, impressions } = metrics;

    // DISCOVERY: New keywords (< 7 days) with limited data
    if (ageInDays < 7 || clicks < 20) {
        return "DISCOVERY";
    }

    // DECLINE: Poor performance or declining metrics
    if (qualityScore < 40 || (clicks > 50 && conversions === 0)) {
        return "DECLINE";
    }

    // MATURITY: Established keywords with stable, good performance
    if (ageInDays > 30 && qualityScore >= 60 && conversions >= 10) {
        return "MATURITY";
    }

    // GROWTH: Improving keywords with good potential
    if (qualityScore >= 50 || (impressions > 500 && metrics.ctr > 1)) {
        return "GROWTH";
    }

    // Default to DISCOVERY for unclear cases
    return "DISCOVERY";
}

/**
 * Calculate net profit for a keyword
 * Formula: Sales - COGS - Amazon Fees - Ad Spend
 */
export interface ProfitCalculation {
    revenue: number;
    cogs: number;
    amazonFees: number;
    adSpend: number;
    netProfit: number;
    profitMargin: number;
    roi: number;
}

export function calculateKeywordProfit(
    sales: number,
    spend: number,
    cogsPercent: number = 0.30, // Default 30% COGS
    feePercent: number = 0.15   // Default 15% Amazon fees (referral + FBA)
): ProfitCalculation {
    const cogs = sales * cogsPercent;
    const amazonFees = sales * feePercent;
    const adSpend = spend;
    const netProfit = sales - cogs - amazonFees - adSpend;
    const profitMargin = sales > 0 ? (netProfit / sales) * 100 : 0;
    const roi = adSpend > 0 ? (netProfit / adSpend) * 100 : 0;

    return {
        revenue: sales,
        cogs,
        amazonFees,
        adSpend,
        netProfit,
        profitMargin,
        roi,
    };
}
