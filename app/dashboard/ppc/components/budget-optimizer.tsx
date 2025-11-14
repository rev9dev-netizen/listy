"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface BudgetOptimizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Recommendation {
  id: string;
  name: string;
  currentBudget: number;
  recommendedBudget: number;
  change: number;
  changePercent: number;
  spend: number;
  sales: number;
  acos: number;
  roas: number;
  efficiency: number;
  reasoning: string;
}

interface OptimizationSummary {
  totalCampaigns: number;
  totalBudget: number;
  current: {
    totalSpend: number;
    totalSales: number;
    avgAcos: number;
    avgRoas: number;
  };
  expected: {
    totalSales: number;
    salesIncrease: number;
    avgAcos: number;
    avgRoas: number;
    acosImprovement: number;
    roasImprovement: number;
  };
}

export default function BudgetOptimizer({
  open,
  onOpenChange,
}: BudgetOptimizerProps) {
  const queryClient = useQueryClient();
  const [totalBudget, setTotalBudget] = useState<string>("");
  const [optimizationResults, setOptimizationResults] = useState<{
    recommendations: Recommendation[];
    summary: OptimizationSummary;
  } | null>(null);

  // Get current campaigns to suggest default budget
  const { data: campaignsData } = useQuery({
    queryKey: ["ppc-campaigns"],
    queryFn: async () => {
      const response = await fetch("/api/ppc/campaigns");
      if (!response.ok) throw new Error("Failed to fetch campaigns");
      return response.json();
    },
    enabled: open,
  });

  // Calculate optimization
  const optimizeMutation = useMutation({
    mutationFn: async (budget: number) => {
      const response = await fetch("/api/ppc/optimize-budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalBudget: budget }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to optimize budget");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setOptimizationResults(data);
      toast.success("Budget optimization calculated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to optimize budget");
    },
  });

  // Apply recommendations
  const applyMutation = useMutation({
    mutationFn: async (recommendations: Recommendation[]) => {
      // Update each campaign's budget
      const updates = recommendations.map((rec) =>
        fetch(`/api/ppc/campaigns/${rec.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dailyBudget: rec.recommendedBudget }),
        })
      );

      const results = await Promise.all(updates);
      const failed = results.filter((r) => !r.ok);

      if (failed.length > 0) {
        throw new Error(`Failed to update ${failed.length} campaigns`);
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ppc-campaigns"] });
      toast.success("Budget allocation updated successfully");
      onOpenChange(false);
      setOptimizationResults(null);
      setTotalBudget("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to apply budget changes");
    },
  });

  const handleOptimize = () => {
    const budget = parseFloat(totalBudget);
    if (isNaN(budget) || budget <= 0) {
      toast.error("Please enter a valid budget amount");
      return;
    }
    optimizeMutation.mutate(budget);
  };

  const handleApply = () => {
    if (!optimizationResults) return;
    applyMutation.mutate(optimizationResults.recommendations);
  };

  // Calculate suggested budget from current campaigns
  const suggestedBudget =
    campaignsData?.campaigns?.reduce(
      (sum: number, c: { dailyBudget: number }) => sum + c.dailyBudget,
      0
    ) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Budget Allocation Optimizer
          </DialogTitle>
          <DialogDescription>
            Optimize your budget allocation across campaigns for maximum ROI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Budget Input */}
          {!optimizationResults && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="totalBudget">Total Daily Budget ($)</Label>
                <div className="flex gap-2">
                  <Input
                    id="totalBudget"
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="Enter total daily budget"
                    value={totalBudget}
                    onChange={(e) => setTotalBudget(e.target.value)}
                  />
                  {suggestedBudget > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setTotalBudget(suggestedBudget.toFixed(2))}
                    >
                      Use Current: ${suggestedBudget.toFixed(2)}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  This is your total budget to allocate across all active
                  campaigns
                </p>
              </div>

              <Button
                onClick={handleOptimize}
                disabled={optimizeMutation.isPending}
                className="w-full"
              >
                {optimizeMutation.isPending
                  ? "Analyzing..."
                  : "Calculate Optimization"}
              </Button>
            </div>
          )}

          {/* Results */}
          {optimizationResults && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      Current Performance
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Avg ACOS:</span>
                        <span className="font-semibold">
                          {optimizationResults.summary.current.avgAcos.toFixed(
                            1
                          )}
                          %
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Avg ROAS:</span>
                        <span className="font-semibold">
                          {optimizationResults.summary.current.avgRoas.toFixed(
                            2
                          )}
                          x
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Total Sales:</span>
                        <span className="font-semibold">
                          $
                          {optimizationResults.summary.current.totalSales.toFixed(
                            2
                          )}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      Expected After Optimization
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Avg ACOS:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-green-600">
                            {optimizationResults.summary.expected.avgAcos.toFixed(
                              1
                            )}
                            %
                          </span>
                          {optimizationResults.summary.expected
                            .acosImprovement > 0 && (
                            <Badge variant="default" className="text-xs">
                              -
                              {optimizationResults.summary.expected.acosImprovement.toFixed(
                                1
                              )}
                              %
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Avg ROAS:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-green-600">
                            {optimizationResults.summary.expected.avgRoas.toFixed(
                              2
                            )}
                            x
                          </span>
                          {optimizationResults.summary.expected
                            .roasImprovement > 0 && (
                            <Badge variant="default" className="text-xs">
                              +
                              {optimizationResults.summary.expected.roasImprovement.toFixed(
                                2
                              )}
                              x
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Total Sales:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-green-600">
                            $
                            {optimizationResults.summary.expected.totalSales.toFixed(
                              2
                            )}
                          </span>
                          {optimizationResults.summary.expected.salesIncrease >
                            0 && (
                            <Badge variant="default" className="text-xs">
                              +$
                              {optimizationResults.summary.expected.salesIncrease.toFixed(
                                2
                              )}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recommendations Table */}
              <div>
                <h3 className="font-semibold mb-3">
                  Recommended Budget Allocation
                </h3>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campaign</TableHead>
                        <TableHead className="text-right">Current</TableHead>
                        <TableHead className="text-center">Change</TableHead>
                        <TableHead className="text-right">
                          Recommended
                        </TableHead>
                        <TableHead>Performance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {optimizationResults.recommendations.map((rec) => (
                        <TableRow key={rec.id}>
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {rec.name}
                          </TableCell>
                          <TableCell className="text-right">
                            ${rec.currentBudget.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              {rec.changePercent > 0 ? (
                                <TrendingUp className="w-4 h-4 text-green-600" />
                              ) : rec.changePercent < 0 ? (
                                <TrendingDown className="w-4 h-4 text-red-600" />
                              ) : (
                                <ArrowRight className="w-4 h-4 text-gray-400" />
                              )}
                              <Badge
                                variant={
                                  rec.changePercent > 0
                                    ? "default"
                                    : rec.changePercent < 0
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {rec.changePercent > 0 ? "+" : ""}
                                {rec.changePercent.toFixed(1)}%
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            ${rec.recommendedBudget.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <div className="text-xs space-y-1">
                              <div>ROAS: {rec.roas.toFixed(2)}x</div>
                              <div>ACOS: {rec.acos.toFixed(1)}%</div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Key Insights */}
              <div className="space-y-2">
                <h3 className="font-semibold">Key Insights</h3>
                <div className="space-y-2">
                  {optimizationResults.recommendations
                    .filter((r) => Math.abs(r.changePercent) > 10)
                    .slice(0, 3)
                    .map((rec) => (
                      <div
                        key={rec.id}
                        className="flex items-start gap-2 p-3 bg-muted rounded-lg"
                      >
                        <Target className="w-4 h-4 mt-0.5 text-blue-500 shrink-0" />
                        <div className="text-sm">
                          <span className="font-medium">{rec.name}:</span>{" "}
                          {rec.reasoning}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          {optimizationResults ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setOptimizationResults(null);
                  setTotalBudget("");
                }}
              >
                Recalculate
              </Button>
              <Button onClick={handleApply} disabled={applyMutation.isPending}>
                {applyMutation.isPending ? "Applying..." : "Apply Changes"}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
