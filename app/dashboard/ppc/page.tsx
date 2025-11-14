"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CreateCampaignDialog } from "./components/create-campaign-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  AlertCircle,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

export default function PPCDashboardPage() {
  const [chatQuestion, setChatQuestion] = useState("");
  const queryClient = useQueryClient();

  // Fetch campaigns
  const {
    data: campaignsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["ppc-campaigns"],
    queryFn: async () => {
      const response = await fetch("/api/ppc/campaigns");
      if (!response.ok) throw new Error("Failed to fetch campaigns");
      return response.json();
    },
  });

  // AI Chat mutation
  const chatMutation = useMutation({
    mutationFn: async (question: string) => {
      const response = await fetch("/api/ppc/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!response.ok) throw new Error("Failed to get answer");
      return response.json();
    },
    onSuccess: (data) => {
      toast.success("AI Response", {
        description: data.answer,
        duration: 10000,
      });
    },
    onError: () => {
      toast.error("Failed to get AI response");
    },
  });

  const handleAskAI = () => {
    if (!chatQuestion.trim()) return;
    chatMutation.mutate(chatQuestion);
    setChatQuestion("");
  };

  const campaigns = campaignsData?.campaigns || [];

  // Calculate metrics
  const totalSpend = campaigns.reduce(
    (sum: number, c: { metrics: { spend: number }[] }) =>
      sum +
      c.metrics.reduce((s: number, m: { spend: number }) => s + m.spend, 0),
    0
  );

  const avgAcos =
    campaigns.reduce((sum: number, c: { metrics: { acos: number }[] }) => {
      const campaignAcos =
        c.metrics.reduce((s: number, m: { acos: number }) => s + m.acos, 0) /
        Math.max(c.metrics.length, 1);
      return sum + campaignAcos;
    }, 0) / Math.max(campaigns.length, 1);

  const totalSales = campaigns.reduce(
    (sum: number, c: { metrics: { sales: number }[] }) =>
      sum +
      c.metrics.reduce((s: number, m: { sales: number }) => s + m.sales, 0),
    0
  );

  const netProfit = totalSales * 0.3 - totalSpend; // Assuming 30% margin

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <h1 className="text-3xl font-bold">PPC Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">PPC Dashboard</h1>
          <p className="text-muted-foreground">
            AI-powered PPC optimization and management
          </p>
        </div>
        <CreateCampaignDialog>
          <Button>
            <Sparkles className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        </CreateCampaignDialog>
      </div>

      {/* Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpend.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average ACOS</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgAcos.toFixed(2)}%</div>
            <p className="text-xs text-green-600 flex items-center">
              <TrendingDown className="w-3 h-3 mr-1" />
              2.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSales.toFixed(2)}</div>
            <p className="text-xs text-green-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              12.3% increase
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Profit ⭐</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                netProfit > 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              ${netProfit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">After ad spend</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Chat Assistant */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            🤖 AI PPC Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Ask anything: Why is my ACOS high? Which keywords should I pause?"
              value={chatQuestion}
              onChange={(e) => setChatQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAskAI()}
              disabled={chatMutation.isPending}
            />
            <Button
              onClick={handleAskAI}
              disabled={chatMutation.isPending || !chatQuestion.trim()}
            >
              {chatMutation.isPending ? "Thinking..." : "Ask AI"}
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge
              variant="secondary"
              className="cursor-pointer"
              onClick={() => setChatQuestion("Why is my ACOS so high today?")}
            >
              Why is my ACOS high?
            </Badge>
            <Badge
              variant="secondary"
              className="cursor-pointer"
              onClick={() =>
                setChatQuestion("Which keywords are wasting money?")
              }
            >
              Which keywords waste money?
            </Badge>
            <Badge
              variant="secondary"
              className="cursor-pointer"
              onClick={() =>
                setChatQuestion("Show me keywords where I should increase bids")
              }
            >
              Where to increase bids?
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-yellow-600" />
            ⚠️ Alerts & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="p-2 bg-yellow-100 rounded-full">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">High ACOS Detected</p>
                <p className="text-sm text-muted-foreground">
                  3 keywords have ACOS above 50% with low conversions. Consider
                  pausing or reducing bids.
                </p>
              </div>
              <Button size="sm" variant="outline">
                Review
              </Button>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="p-2 bg-green-100 rounded-full">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Opportunity Found</p>
                <p className="text-sm text-muted-foreground">
                  &quot;wireless charger&quot; keyword shows high CTR (2.1%) but
                  low bid. Increase bid by 20% to capture more traffic.
                </p>
              </div>
              <Button size="sm" variant="outline">
                Apply
              </Button>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="p-2 bg-blue-100 rounded-full">
                <Sparkles className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">AI Suggestion</p>
                <p className="text-sm text-muted-foreground">
                  Detected seasonal trend for &quot;holiday gifts&quot;.
                  Consider creating a dedicated campaign.
                </p>
              </div>
              <Button size="sm" variant="outline">
                Create
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first PPC campaign to get started
              </p>
              <CreateCampaignDialog>
                <Button>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Campaign
                </Button>
              </CreateCampaignDialog>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Spend</TableHead>
                  <TableHead>ACOS</TableHead>
                  <TableHead>Sales</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map(
                  (campaign: {
                    id: string;
                    campaignName: string;
                    campaignType: string;
                    status: string;
                    dailyBudget: number;
                    metrics: { spend: number; acos: number; sales: number }[];
                  }) => {
                    const totalCampaignSpend = campaign.metrics.reduce(
                      (s, m) => s + m.spend,
                      0
                    );
                    const avgCampaignAcos =
                      campaign.metrics.reduce((s, m) => s + m.acos, 0) /
                      Math.max(campaign.metrics.length, 1);
                    const totalCampaignSales = campaign.metrics.reduce(
                      (s, m) => s + m.sales,
                      0
                    );

                    return (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">
                          {campaign.campaignName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {campaign.campaignType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              campaign.status === "Active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {campaign.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          ${campaign.dailyBudget.toFixed(2)}
                        </TableCell>
                        <TableCell>${totalCampaignSpend.toFixed(2)}</TableCell>
                        <TableCell>{avgCampaignAcos.toFixed(2)}%</TableCell>
                        <TableCell>${totalCampaignSales.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              (window.location.href = `/dashboard/ppc/campaigns/${campaign.id}`)
                            }
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  }
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
