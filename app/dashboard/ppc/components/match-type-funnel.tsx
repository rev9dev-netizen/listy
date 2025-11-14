"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Target, Zap } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface MatchTypeFunnelProps {
  campaignId?: string;
}

interface MatchTypeData {
  matchType: string;
  keywords: number;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  sales: number;
  acos: number;
  ctr: number;
  conversionRate: number;
}

export default function MatchTypeFunnel({ campaignId }: MatchTypeFunnelProps) {
  // Fetch match type performance data
  const { data, isLoading } = useQuery({
    queryKey: ["match-type-funnel", campaignId],
    queryFn: async () => {
      const url = campaignId
        ? `/api/ppc/keywords?campaignId=${campaignId}`
        : "/api/ppc/keywords";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch keywords");
      const result = await response.json();

      // Aggregate by match type
      const matchTypes = ["Broad", "Phrase", "Exact"];
      const aggregated: Record<string, MatchTypeData> = {};

      matchTypes.forEach((mt) => {
        aggregated[mt] = {
          matchType: mt,
          keywords: 0,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          spend: 0,
          sales: 0,
          acos: 0,
          ctr: 0,
          conversionRate: 0,
        };
      });

      result.keywords?.forEach(
        (keyword: {
          matchType: string;
          impressions?: number;
          clicks?: number;
          orders?: number;
          spend?: number;
          sales?: number;
        }) => {
          const mt = keyword.matchType;
          if (aggregated[mt]) {
            aggregated[mt].keywords++;
            aggregated[mt].impressions += keyword.impressions || 0;
            aggregated[mt].clicks += keyword.clicks || 0;
            aggregated[mt].conversions += keyword.orders || 0;
            aggregated[mt].spend += keyword.spend || 0;
            aggregated[mt].sales += keyword.sales || 0;
          }
        }
      );

      // Calculate rates
      Object.values(aggregated).forEach((data) => {
        data.acos = data.sales > 0 ? (data.spend / data.sales) * 100 : 0;
        data.ctr =
          data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0;
        data.conversionRate =
          data.clicks > 0 ? (data.conversions / data.clicks) * 100 : 0;
      });

      return {
        matchTypes: Object.values(aggregated),
        recommendations: generateRecommendations(Object.values(aggregated)),
      };
    },
  });

  const matchTypes: MatchTypeData[] = data?.matchTypes || [];
  const recommendations = data?.recommendations || [];

  const generateRecommendations = (matchTypes: MatchTypeData[]) => {
    const recs = [];
    const broad = matchTypes.find((m) => m.matchType === "Broad");
    const phrase = matchTypes.find((m) => m.matchType === "Phrase");
    const exact = matchTypes.find((m) => m.matchType === "Exact");

    if (broad && broad.acos < 30 && broad.conversionRate > 2) {
      recs.push({
        from: "Broad",
        to: "Phrase",
        reason:
          "Broad match is performing well. Refine to Phrase for better control.",
        impact: "Maintain performance with lower wasted spend",
      });
    }

    if (phrase && phrase.conversionRate > 3 && phrase.acos < 25) {
      recs.push({
        from: "Phrase",
        to: "Exact",
        reason:
          "Phrase match has high conversion rate. Test Exact for max efficiency.",
        impact: "Increase profit margin by 10-15%",
      });
    }

    if (exact && exact.acos > 40) {
      recs.push({
        from: "Exact",
        to: "Phrase",
        reason: "Exact match has high ACOS. Broaden to Phrase for more volume.",
        impact: "Increase impressions and potentially lower ACOS",
      });
    }

    if (broad && broad.acos > 50) {
      recs.push({
        from: "Broad",
        to: "Pause",
        reason:
          "Broad match is unprofitable. Consider pausing or adding negatives.",
        impact: "Stop wasted spend immediately",
      });
    }

    return recs;
  };

  const COLORS = {
    Broad: "#8b5cf6",
    Phrase: "#3b82f6",
    Exact: "#10b981",
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Funnel Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            Match Type Performance Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={matchTypes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="matchType" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="impressions" fill="#e0e7ff" name="Impressions" />
              <Bar dataKey="clicks" fill="#93c5fd" name="Clicks" />
              <Bar dataKey="conversions" fill="#3b82f6" name="Conversions" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Match Type Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {matchTypes.map((mt) => (
          <Card key={mt.matchType}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{mt.matchType} Match</CardTitle>
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor:
                      COLORS[mt.matchType as keyof typeof COLORS],
                  }}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Keywords</p>
                  <p className="font-semibold">{mt.keywords}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Impressions</p>
                  <p className="font-semibold">
                    {mt.impressions.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">CTR</p>
                  <p className="font-semibold">{mt.ctr.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Conv. Rate</p>
                  <p className="font-semibold">
                    {mt.conversionRate.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">ACOS</p>
                  <p
                    className={`font-semibold ${
                      mt.acos < 30
                        ? "text-green-600"
                        : mt.acos < 50
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {mt.acos.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Spend</p>
                  <p className="font-semibold">${mt.spend.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Optimization Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendations.map(
              (
                rec: {
                  from: string;
                  to: string;
                  reason: string;
                  impact: string;
                },
                index: number
              ) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-2 min-w-[180px]">
                    <Badge
                      variant="outline"
                      className="bg-purple-50 text-purple-700"
                    >
                      {rec.from}
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700"
                    >
                      {rec.to}
                    </Badge>
                  </div>

                  <div className="flex-1">
                    <p className="font-medium mb-1">{rec.reason}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {rec.impact}
                    </p>
                  </div>

                  <Button size="sm" variant="outline">
                    Apply
                  </Button>
                </div>
              )
            )}
          </CardContent>
        </Card>
      )}

      {/* Funnel Flow Diagram */}
      <Card>
        <CardHeader>
          <CardTitle>Match Type Transition Strategy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-8 py-8">
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                <div className="text-center">
                  <p className="font-bold text-2xl">
                    {matchTypes.find((m) => m.matchType === "Broad")
                      ?.keywords || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Broad</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Discovery Phase</p>
            </div>

            <ArrowRight className="w-8 h-8 text-muted-foreground" />

            <div className="text-center">
              <div className="w-28 h-28 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                <div className="text-center">
                  <p className="font-bold text-xl">
                    {matchTypes.find((m) => m.matchType === "Phrase")
                      ?.keywords || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Phrase</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Testing Phase</p>
            </div>

            <ArrowRight className="w-8 h-8 text-muted-foreground" />

            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <div className="text-center">
                  <p className="font-bold text-lg">
                    {matchTypes.find((m) => m.matchType === "Exact")
                      ?.keywords || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Exact</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Scale Phase</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm">
              <strong>Pro Tip:</strong> Start with Broad match to discover
              high-performing search terms, move profitable keywords to Phrase
              for better control, then scale winners with Exact match for
              maximum efficiency.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
