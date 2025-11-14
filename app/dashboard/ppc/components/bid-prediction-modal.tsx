"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Sparkles,
  DollarSign,
  Target,
  MousePointerClick,
} from "lucide-react";
import { toast } from "sonner";

interface BidPredictionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyword: {
    id: string;
    keyword: string;
    matchType: string;
    bid: number;
    asin?: string;
  };
  onApplyBid?: (newBid: number) => void;
}

interface PredictionResult {
  predictedCpc: number;
  predictedClicks: number;
  predictedConversions: number;
  predictedSales: number;
  predictedAcos: number;
  recommendedBid: number;
  confidence: number;
  reasoning: string;
  expectedRoi: number;
}

export default function BidPredictionModal({
  open,
  onOpenChange,
  keyword,
  onApplyBid,
}: BidPredictionModalProps) {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);

  const predictMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/ppc/ai/predict-bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywordId: keyword.id,
          keyword: keyword.keyword,
          currentBid: keyword.bid,
          matchType: keyword.matchType,
          asin: keyword.asin,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to predict bid");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setPrediction(data.prediction);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to get bid prediction");
    },
  });

  const applyBidMutation = useMutation({
    mutationFn: async (newBid: number) => {
      const response = await fetch(`/api/ppc/keywords/${keyword.id}/bid`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bid: newBid,
          reason: `AI recommended bid: ${
            prediction?.reasoning || "Optimized for performance"
          }`,
        }),
      });
      if (!response.ok) throw new Error("Failed to update bid");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Bid updated successfully!");
      onOpenChange(false);
      if (onApplyBid && prediction) {
        onApplyBid(prediction.recommendedBid);
      }
    },
    onError: () => {
      toast.error("Failed to update bid");
    },
  });

  // Auto-run prediction when modal opens
  useState(() => {
    if (open && !prediction && !predictMutation.isPending) {
      predictMutation.mutate();
    }
  });

  const handleApplyBid = () => {
    if (prediction) {
      applyBidMutation.mutate(prediction.recommendedBid);
    }
  };

  const bidChange = prediction
    ? ((prediction.recommendedBid - keyword.bid) / keyword.bid) * 100
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Bid Prediction
          </DialogTitle>
          <DialogDescription>
            Analyzing optimal bid for &quot;{keyword.keyword}&quot; (
            {keyword.matchType})
          </DialogDescription>
        </DialogHeader>

        {predictMutation.isPending && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600 mb-4" />
            <p className="text-sm text-muted-foreground">
              AI is analyzing performance data and market conditions...
            </p>
          </div>
        )}

        {predictMutation.isError && (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">
              Failed to generate prediction. Please try again.
            </p>
            <Button onClick={() => predictMutation.mutate()}>Retry</Button>
          </div>
        )}

        {prediction && (
          <div className="space-y-4">
            {/* Current vs Recommended Bid */}
            <Card className="bg-linear-to-br from-purple-50 to-blue-50 border-purple-200">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Current Bid
                    </p>
                    <p className="text-3xl font-bold text-gray-700">
                      ${keyword.bid.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Recommended Bid
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-3xl font-bold text-purple-600">
                        ${prediction.recommendedBid.toFixed(2)}
                      </p>
                      <Badge
                        variant={bidChange > 0 ? "default" : "secondary"}
                        className={
                          bidChange > 0
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }
                      >
                        {bidChange > 0 ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        )}
                        {Math.abs(bidChange).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Predicted Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <MousePointerClick className="w-4 h-4" />
                    <p className="text-xs">Predicted CPC</p>
                  </div>
                  <p className="text-2xl font-bold">
                    ${prediction.predictedCpc.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <MousePointerClick className="w-4 h-4" />
                    <p className="text-xs">Predicted Clicks</p>
                  </div>
                  <p className="text-2xl font-bold">
                    {prediction.predictedClicks.toFixed(0)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <DollarSign className="w-4 h-4" />
                    <p className="text-xs">Predicted Sales</p>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    ${prediction.predictedSales.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Target className="w-4 h-4" />
                    <p className="text-xs">Predicted ACOS</p>
                  </div>
                  <p
                    className={`text-2xl font-bold ${
                      prediction.predictedAcos < 25
                        ? "text-green-600"
                        : prediction.predictedAcos < 35
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {prediction.predictedAcos.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* AI Reasoning */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-start gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-600 mt-0.5" />
                  <p className="text-sm font-semibold">AI Analysis</p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {prediction.reasoning}
                </p>
              </CardContent>
            </Card>

            {/* Confidence & ROI */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">
                  Prediction Confidence
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-purple-500 to-blue-500"
                      style={{ width: `${prediction.confidence}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold">
                    {prediction.confidence.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Expected ROI</p>
                <p className="text-lg font-bold text-green-600">
                  {prediction.expectedRoi.toFixed(0)}%
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                onClick={handleApplyBid}
                disabled={applyBidMutation.isPending}
              >
                {applyBidMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Apply Recommended Bid
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
