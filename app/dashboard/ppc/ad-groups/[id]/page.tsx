/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import KeywordsTable from "../../components/keywords-table";
import AddKeywordsDialog from "../../components/add-keywords-dialog";

export default function AdGroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const adGroupId = params.id as string;

  // Fetch keywords for this ad group
  const { data: keywordsData, isLoading: isLoadingKeywords } = useQuery({
    queryKey: ["keywords", adGroupId],
    queryFn: async () => {
      const response = await fetch(`/api/ppc/keywords?adGroupId=${adGroupId}`);
      if (!response.ok) throw new Error("Failed to fetch keywords");
      return response.json();
    },
  });

  // Fetch ad groups to get current ad group details
  const { data: adGroupsData, isLoading: isLoadingAdGroup } = useQuery({
    queryKey: ["ad-groups"],
    queryFn: async () => {
      const response = await fetch("/api/ppc/ad-groups");
      if (!response.ok) throw new Error("Failed to fetch ad groups");
      return response.json();
    },
  });

  if (isLoadingKeywords || isLoadingAdGroup) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Find the specific ad group
  const adGroup = adGroupsData?.adGroups?.find(
    (ag: any) => ag.id === adGroupId
  );

  if (!adGroup) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Ad group not found</p>
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const keywords = keywordsData?.keywords || [];

  // Calculate aggregated metrics
  const totalImpressions = keywords.reduce(
    (sum: number, kw: any) => sum + (kw.impressions || 0),
    0
  );
  const totalClicks = keywords.reduce(
    (sum: number, kw: any) => sum + (kw.clicks || 0),
    0
  );
  const totalConversions = keywords.reduce(
    (sum: number, kw: any) => sum + (kw.conversions || 0),
    0
  );
  const totalSpend = keywords.reduce(
    (sum: number, kw: any) => sum + (kw.spend || 0),
    0
  );
  const totalSales = keywords.reduce(
    (sum: number, kw: any) => sum + (kw.sales || 0),
    0
  );
  const avgAcos = totalSales > 0 ? (totalSpend / totalSales) * 100 : 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{adGroup.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={adGroup.status === "ENABLED" ? "default" : "secondary"}
              >
                {adGroup.status}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Default Bid: ${adGroup.defaultBid.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Edit Ad Group</Button>
          <AddKeywordsDialog adGroupId={adGroupId}>
            <Button>Add Keywords</Button>
          </AddKeywordsDialog>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{keywords.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Impressions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalImpressions.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalClicks.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpend.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">ACOS</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                avgAcos > 30
                  ? "text-red-600"
                  : avgAcos > 20
                  ? "text-yellow-600"
                  : "text-green-600"
              }`}
            >
              {avgAcos.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Keywords Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Keywords</CardTitle>
            <AddKeywordsDialog adGroupId={adGroupId}>
              <Button size="sm" variant="outline">
                Add Keywords
              </Button>
            </AddKeywordsDialog>
          </div>
        </CardHeader>
        <CardContent>
          <KeywordsTable keywords={keywords} adGroupId={adGroupId} />
        </CardContent>
      </Card>
    </div>
  );
}
