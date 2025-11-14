"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { MoreVertical, Play, Pause, Sparkles, Zap } from "lucide-react";
import BidPredictionModal from "./bid-prediction-modal";
import BulkBidAdjustmentDialog from "./bulk-bid-adjustment-dialog";

interface Keyword {
  id: string;
  keyword: string;
  matchType: string;
  bid: number;
  status: string;
  qualityScore: number;
  lifecycle: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  sales: number;
  ctr: number;
  conversionRate: number;
  acos: number;
  cpc: number;
  netProfit: number;
}

interface KeywordsTableProps {
  keywords: Keyword[];
  adGroupId: string;
}

// Lifecycle emoji mapping
const LIFECYCLE_EMOJI: Record<string, string> = {
  DISCOVERY: "🌱",
  GROWTH: "📈",
  MATURITY: "⚖️",
  DECLINE: "📉",
};

// Quality score color coding
const getQualityScoreColor = (score: number): string => {
  if (score >= 71) return "text-green-600 bg-green-50";
  if (score >= 51) return "text-yellow-600 bg-yellow-50";
  return "text-red-600 bg-red-50";
};

const getQualityScoreVariant = (
  score: number
): "default" | "secondary" | "destructive" => {
  if (score >= 71) return "default";
  if (score >= 51) return "secondary";
  return "destructive";
};

export default function KeywordsTable({
  keywords,
  adGroupId,
}: KeywordsTableProps) {
  const [editingBid, setEditingBid] = useState<string | null>(null);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [newBid, setNewBid] = useState<string>("");
  const [selectedKeyword, setSelectedKeyword] = useState<Keyword | null>(null);
  const [showBidPrediction, setShowBidPrediction] = useState(false);
  const queryClient = useQueryClient();

  // Update bid mutation
  const updateBidMutation = useMutation({
    mutationFn: async ({
      keywordId,
      bid,
    }: {
      keywordId: string;
      bid: number;
    }) => {
      const response = await fetch(`/api/ppc/keywords/${keywordId}/bid`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bid, reason: "Manual bid adjustment" }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update bid");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Bid updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["keywords", adGroupId] });
      setEditingBid(null);
      setNewBid("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update bid");
    },
  });

  // Toggle keyword status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({
      keywordId,
      status,
    }: {
      keywordId: string;
      status: string;
    }) => {
      const response = await fetch(`/api/ppc/keywords/${keywordId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keywords", adGroupId] });
      toast.success("Status updated!");
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  const handleBidUpdate = (keywordId: string, currentBid: number) => {
    setEditingBid(keywordId);
    setNewBid(currentBid.toString());
  };

  const handleSaveBid = (keywordId: string) => {
    const bidValue = parseFloat(newBid);
    if (isNaN(bidValue) || bidValue <= 0) {
      toast.error("Please enter a valid bid amount");
      return;
    }
    updateBidMutation.mutate({ keywordId, bid: bidValue });
  };

  const handleCancelBid = () => {
    setEditingBid(null);
    setNewBid("");
  };

  const handleToggleStatus = (keywordId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ENABLED" ? "PAUSED" : "ENABLED";
    toggleStatusMutation.mutate({ keywordId, status: newStatus });
  };

  // Recalculate quality score mutation
  const recalculateQualityMutation = useMutation({
    mutationFn: async (keywordId: string) => {
      const response = await fetch("/api/ppc/keywords/quality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywordId }),
      });
      if (!response.ok) throw new Error("Failed to recalculate quality");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keywords", adGroupId] });
      toast.success("Quality score updated");
    },
    onError: () => {
      toast.error("Failed to update quality score");
    },
  });

  if (keywords.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground mb-4">No keywords yet.</p>
        <p className="text-sm text-muted-foreground">
          Add keywords to start tracking performance and optimizing bids.
        </p>
      </div>
    );
  }

  const toggleKeywordSelection = (keywordId: string) => {
    setSelectedKeywords((prev) =>
      prev.includes(keywordId)
        ? prev.filter((id) => id !== keywordId)
        : [...prev, keywordId]
    );
  };

  const toggleAllKeywords = () => {
    if (selectedKeywords.length === keywords.length) {
      setSelectedKeywords([]);
    } else {
      setSelectedKeywords(keywords.map((k) => k.id));
    }
  };

  const handleBulkActionSuccess = () => {
    setSelectedKeywords([]);
  };

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedKeywords.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedKeywords.length === keywords.length}
              onCheckedChange={toggleAllKeywords}
            />
            <span className="text-sm font-medium">
              {selectedKeywords.length} keyword
              {selectedKeywords.length !== 1 ? "s" : ""} selected
            </span>
          </div>
          <Button size="sm" onClick={() => setShowBulkDialog(true)}>
            <Zap className="w-4 h-4 mr-2" />
            Bulk Actions
          </Button>
        </div>
      )}

      {/* Bulk Adjustment Dialog */}
      <BulkBidAdjustmentDialog
        open={showBulkDialog}
        onOpenChange={setShowBulkDialog}
        selectedKeywordIds={selectedKeywords}
        onSuccess={handleBulkActionSuccess}
      />

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={
                    selectedKeywords.length === keywords.length &&
                    keywords.length > 0
                  }
                  onCheckedChange={toggleAllKeywords}
                />
              </TableHead>
              <TableHead>Keyword</TableHead>
              <TableHead>Match Type</TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Quality
                </div>
              </TableHead>
              <TableHead className="text-center">Phase</TableHead>
              <TableHead>Bid</TableHead>
              <TableHead className="text-right">Impressions</TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead className="text-right">Conv.</TableHead>
              <TableHead className="text-right">Spend</TableHead>
              <TableHead className="text-right">Sales</TableHead>
              <TableHead className="text-right">ACOS</TableHead>
              <TableHead className="text-right">Net Profit</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keywords.map((keyword) => (
              <TableRow key={keyword.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedKeywords.includes(keyword.id)}
                    onCheckedChange={() => toggleKeywordSelection(keyword.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <div>
                    <div>{keyword.keyword}</div>
                    <Badge
                      variant={
                        keyword.status === "ENABLED" ? "default" : "secondary"
                      }
                      className="text-xs mt-1"
                    >
                      {keyword.status}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{keyword.matchType}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={getQualityScoreVariant(keyword.qualityScore)}
                    className={getQualityScoreColor(keyword.qualityScore)}
                  >
                    {keyword.qualityScore}
                  </Badge>
                </TableCell>
                <TableCell className="text-center text-2xl">
                  {LIFECYCLE_EMOJI[keyword.lifecycle] || "❓"}
                </TableCell>
                <TableCell>
                  {editingBid === keyword.id ? (
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        step="0.01"
                        value={newBid}
                        onChange={(e) => setNewBid(e.target.value)}
                        className="w-20 h-8"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSaveBid(keyword.id)}
                        disabled={updateBidMutation.isPending}
                      >
                        ✓
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelBid}
                        disabled={updateBidMutation.isPending}
                      >
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBidUpdate(keyword.id, keyword.bid)}
                      className="font-mono"
                    >
                      ${keyword.bid.toFixed(2)}
                    </Button>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {keyword.impressions.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {keyword.clicks.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {keyword.conversions}
                </TableCell>
                <TableCell className="text-right">
                  ${keyword.spend.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  ${keyword.sales.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={
                      keyword.acos > 30
                        ? "text-red-600"
                        : keyword.acos > 20
                        ? "text-yellow-600"
                        : "text-green-600"
                    }
                  >
                    {keyword.acos.toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={
                      keyword.netProfit > 0
                        ? "text-green-600 font-semibold"
                        : "text-red-600"
                    }
                  >
                    ${keyword.netProfit.toFixed(2)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleBidUpdate(keyword.id, keyword.bid)}
                      >
                        Edit Bid
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedKeyword(keyword);
                          setShowBidPrediction(true);
                        }}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        AI Bid Prediction
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          recalculateQualityMutation.mutate(keyword.id)
                        }
                        disabled={recalculateQualityMutation.isPending}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Recalculate Quality
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          handleToggleStatus(keyword.id, keyword.status)
                        }
                      >
                        {keyword.status === "ENABLED" ? (
                          <>
                            <Pause className="w-4 h-4 mr-2" />
                            Pause Keyword
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Enable Keyword
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Bid Prediction Modal */}
      {selectedKeyword && (
        <BidPredictionModal
          open={showBidPrediction}
          onOpenChange={setShowBidPrediction}
          keyword={selectedKeyword}
          onApplyBid={() => {
            queryClient.invalidateQueries({
              queryKey: ["keywords", adGroupId],
            });
          }}
        />
      )}
    </div>
  );
}
