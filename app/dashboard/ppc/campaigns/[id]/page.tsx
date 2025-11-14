"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Play,
  Pause,
  TrendingUp,
  TrendingDown,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import CreateAdGroupDialog from "../../components/create-ad-group-dialog";
import AuditResultsModal from "../../components/audit-results-modal";
import CampaignCharts from "../../components/campaign-charts";
import DaypartingSchedule from "../../components/dayparting-schedule";

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const campaignId = params.id as string;
  const [showAudit, setShowAudit] = useState(false);

  // Fetch campaign details
  const { data: campaignsData, isLoading } = useQuery({
    queryKey: ["ppc-campaigns"],
    queryFn: async () => {
      const response = await fetch("/api/ppc/campaigns");
      if (!response.ok) throw new Error("Failed to fetch campaigns");
      return response.json();
    },
  });

  // Pause/Resume campaign mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const response = await fetch(`/api/ppc/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error("Failed to update campaign status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ppc-campaigns"] });
      toast.success("Campaign status updated successfully");
    },
    onError: () => {
      toast.error("Failed to update campaign status");
    },
  });

  const handleToggleStatus = () => {
    if (!campaign) return;
    const newStatus = campaign.status === "Active" ? "Paused" : "Active";
    updateStatusMutation.mutate(newStatus);
  };

  const campaign = campaignsData?.campaigns?.find(
    (c: { id: string }) => c.id === campaignId
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Campaign not found</h2>
          <Button onClick={() => router.push("/dashboard/ppc")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const totalSpend =
    campaign.metrics?.reduce(
      (sum: number, m: { spend: number }) => sum + m.spend,
      0
    ) || 0;

  const avgAcos =
    campaign.metrics?.reduce(
      (sum: number, m: { acos: number }) => sum + m.acos,
      0
    ) / Math.max(campaign.metrics?.length || 1, 1) || 0;

  const totalSales =
    campaign.metrics?.reduce(
      (sum: number, m: { sales: number }) => sum + m.sales,
      0
    ) || 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/ppc")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{campaign.campaignName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={campaign.status === "Active" ? "default" : "secondary"}
              >
                {campaign.status}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {campaign.campaignType} • {campaign.marketplace}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleToggleStatus}
            disabled={updateStatusMutation.isPending}
          >
            {campaign.status === "Active" ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                {updateStatusMutation.isPending ? "Pausing..." : "Pause"}
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                {updateStatusMutation.isPending ? "Resuming..." : "Resume"}
              </>
            )}
          </Button>
          <Button variant="outline">Edit Campaign</Button>
          <Button variant="outline" onClick={() => setShowAudit(true)}>
            <Sparkles className="w-4 h-4 mr-2" />
            Run Audit
          </Button>
          <CreateAdGroupDialog campaignId={campaignId}>
            <Button>Create Ad Group</Button>
          </CreateAdGroupDialog>
        </div>
      </div>

      {/* Audit Modal */}
      <AuditResultsModal
        open={showAudit}
        onOpenChange={setShowAudit}
        campaignId={campaignId}
        campaignName={campaign.campaignName}
      />

      {/* Charts */}
      {campaign.metrics && campaign.metrics.length > 0 && (
        <CampaignCharts
          metrics={campaign.metrics}
          keywords={
            campaign.adGroups?.flatMap(
              (ag: { keywords: unknown[] }) => ag.keywords || []
            ) || []
          }
          dailyBudget={campaign.dailyBudget}
        />
      )}

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpend.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">ACOS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgAcos.toFixed(2)}%</div>
            <p className="text-xs text-green-600 flex items-center">
              <TrendingDown className="w-3 h-3 mr-1" />
              Target: {campaign.targetAcos}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSales.toFixed(2)}</div>
            <p className="text-xs text-green-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              From ad spend
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Daily Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${campaign.dailyBudget.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Per day</p>
          </CardContent>
        </Card>
      </div>

      {/* Ad Groups */}
      <Card>
        <CardHeader>
          <CardTitle>Ad Groups</CardTitle>
        </CardHeader>
        <CardContent>
          {campaign.adGroups?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad Group Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Keywords</TableHead>
                  <TableHead>Default Bid</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaign.adGroups.map(
                  (adGroup: {
                    id: string;
                    name: string;
                    status: string;
                    defaultBid: number;
                    keywords: unknown[];
                  }) => (
                    <TableRow key={adGroup.id}>
                      <TableCell className="font-medium">
                        {adGroup.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            adGroup.status === "Active"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {adGroup.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{adGroup.keywords?.length || 0}</TableCell>
                      <TableCell>${adGroup.defaultBid.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/dashboard/ppc/ad-groups/${adGroup.id}`
                            )
                          }
                        >
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No ad groups yet. Create one to add keywords.
              </p>
              <CreateAdGroupDialog campaignId={campaignId}>
                <Button>Create Ad Group</Button>
              </CreateAdGroupDialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dayparting Schedule */}
      <DaypartingSchedule campaignId={campaignId} />
    </div>
  );
}
