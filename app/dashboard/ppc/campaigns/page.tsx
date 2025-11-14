"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PpcSubNav } from "../components/ppc-sub-nav";
import { AiChatPanel } from "../components/ai-chat-panel";
import { CreateCampaignDialog } from "../components/create-campaign-dialog";
import CampaignStrategyWizard from "../components/campaign-strategy-wizard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  Target,
  Megaphone,
  MoreVertical,
  Bot,
  Sparkles,
  Eye,
  Pause,
  Play,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function CampaignsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showAiChat, setShowAiChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch campaigns
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const res = await fetch("/api/ppc/campaigns");
      if (!res.ok) throw new Error("Failed to fetch campaigns");
      return res.json();
    },
  });

  // Pause/Resume mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/ppc/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: status === "Active" ? "Paused" : "Active",
        }),
      });
      if (!res.ok) throw new Error("Failed to update campaign");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign status updated");
    },
    onError: () => toast.error("Failed to update campaign"),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/ppc/campaigns/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete campaign");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign deleted");
    },
    onError: () => toast.error("Failed to delete campaign"),
  });

  // Filter campaigns
  const filteredCampaigns = campaigns?.filter(
    (campaign: { campaignName: string; status: string }) => {
      const matchesSearch = campaign.campaignName
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || campaign.status === statusFilter;
      return matchesSearch && matchesStatus;
    }
  );

  // Calculate stats
  const stats = campaigns
    ? {
        active: campaigns.filter(
          (c: { status: string }) => c.status === "Active"
        ).length,
        paused: campaigns.filter(
          (c: { status: string }) => c.status === "Paused"
        ).length,
        totalSpend: campaigns.reduce(
          (sum: number, c: { dailyBudget: number }) => sum + c.dailyBudget,
          0
        ),
        avgAcos:
          campaigns.length > 0
            ? campaigns.reduce(
                (sum: number, c: { targetAcos: number | null }) =>
                  sum + (c.targetAcos || 0),
                0
              ) / campaigns.length
            : 0,
      }
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Campaigns</h1>
              <p className="text-muted-foreground">
                Manage your PPC advertising campaigns
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowAiChat(true)} variant="outline">
                <Bot className="h-4 w-4 mr-2" />
                AI Assistant
              </Button>
              <CampaignStrategyWizard>
                <Button variant="secondary">
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Strategy
                </Button>
              </CampaignStrategyWizard>
              <CreateCampaignDialog>
                <Button>
                  <Megaphone className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </CreateCampaignDialog>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Navigation */}
      <PpcSubNav />

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Campaigns
                </CardTitle>
                <Play className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.active}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Paused Campaigns
                </CardTitle>
                <Pause className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.paused}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Daily Budget
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats.totalSpend.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Target ACOS
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.avgAcos.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-4">
          <Input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Paused">Paused</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Campaigns Table */}
        <Card>
          <CardHeader>
            <CardTitle>Your Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading campaigns...
              </div>
            ) : filteredCampaigns?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No campaigns found. Create your first campaign to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Marketplace</TableHead>
                    <TableHead>Daily Budget</TableHead>
                    <TableHead>Target ACOS</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCampaigns?.map(
                    (campaign: {
                      id: string;
                      campaignName: string;
                      campaignType: string;
                      status: string;
                      marketplace: string;
                      dailyBudget: number;
                      targetAcos: number | null;
                      startDate: string;
                    }) => (
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
                        <TableCell>{campaign.marketplace}</TableCell>
                        <TableCell>
                          ${campaign.dailyBudget.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {campaign.targetAcos
                            ? `${campaign.targetAcos}%`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {new Date(campaign.startDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `/dashboard/ppc/campaigns/${campaign.id}`
                                  )
                                }
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  toggleStatusMutation.mutate({
                                    id: campaign.id,
                                    status: campaign.status,
                                  })
                                }
                              >
                                {campaign.status === "Active" ? (
                                  <>
                                    <Pause className="h-4 w-4 mr-2" />
                                    Pause
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-4 w-4 mr-2" />
                                    Resume
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  deleteMutation.mutate(campaign.id)
                                }
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Chat Panel */}
      <AiChatPanel open={showAiChat} onOpenChange={setShowAiChat} />
    </div>
  );
}
