"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Loader2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Target,
  DollarSign,
  TrendingUp,
} from "lucide-react";

interface StrategyWizardProps {
  children: React.ReactNode;
  onComplete?: () => void;
}

interface StrategyInput {
  asin: string;
  productTitle?: string;
  targetAcos: string;
  dailyBudget: string;
  rankGoal: string;
  marketplace: string;
  aggressiveness: string;
}

interface GeneratedStrategy {
  campaignStructure: {
    name: string;
    type: string;
    dailyBudget: number;
    adGroups: {
      name: string;
      keywords: {
        keyword: string;
        matchType: string;
        suggestedBid: number;
        searchVolume: number;
        competitionLevel: string;
      }[];
    }[];
  };
  projectedMetrics: {
    estimatedClicks: number;
    estimatedConversions: number;
    estimatedSales: number;
    estimatedAcos: number;
    estimatedRank: number;
  };
  aiRecommendations: string[];
  reasoning: string;
}

export default function CampaignStrategyWizard({
  children,
  onComplete,
}: StrategyWizardProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<StrategyInput>({
    asin: "",
    targetAcos: "25",
    dailyBudget: "50",
    rankGoal: "10",
    marketplace: "US",
    aggressiveness: "moderate",
  });
  const [strategy, setStrategy] = useState<GeneratedStrategy | null>(null);

  const generateStrategyMutation = useMutation({
    mutationFn: async (data: StrategyInput) => {
      const response = await fetch("/api/ppc/ai/strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate strategy");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setStrategy(data.strategy);
      setStep(3);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to generate strategy");
    },
  });

  const applyStrategyMutation = useMutation({
    mutationFn: async () => {
      if (!strategy) return;

      // Create campaign with generated structure
      const response = await fetch("/api/ppc/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignName: strategy.campaignStructure.name,
          asin: formData.asin,
          campaignType: strategy.campaignStructure.type,
          targetingType: "MANUAL",
          marketplace: formData.marketplace,
          dailyBudget: parseFloat(formData.dailyBudget),
          targetAcos: parseFloat(formData.targetAcos),
          startDate: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to create campaign");
      const campaignData = await response.json();

      // Create ad groups and keywords
      for (const adGroupStructure of strategy.campaignStructure.adGroups) {
        const adGroupResponse = await fetch("/api/ppc/ad-groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaignId: campaignData.campaign.id,
            name: adGroupStructure.name,
            defaultBid: adGroupStructure.keywords[0]?.suggestedBid || 0.75,
            status: "ENABLED",
          }),
        });

        if (adGroupResponse.ok) {
          const adGroupData = await adGroupResponse.json();

          // Add keywords to ad group
          await fetch("/api/ppc/keywords", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              adGroupId: adGroupData.adGroup.id,
              keywords: adGroupStructure.keywords.map((kw) => ({
                keyword: kw.keyword,
                matchType: kw.matchType,
                bid: kw.suggestedBid,
                status: "ENABLED",
              })),
            }),
          });
        }
      }

      return campaignData;
    },
    onSuccess: () => {
      toast.success("Campaign strategy applied successfully!");
      setOpen(false);
      resetWizard();
      if (onComplete) onComplete();
    },
    onError: () => {
      toast.error("Failed to apply strategy");
    },
  });

  const resetWizard = () => {
    setStep(1);
    setFormData({
      asin: "",
      targetAcos: "25",
      dailyBudget: "50",
      rankGoal: "10",
      marketplace: "US",
      aggressiveness: "moderate",
    });
    setStrategy(null);
  };

  const handleNext = () => {
    if (step === 1) {
      // Validate step 1
      if (!formData.asin || !formData.marketplace) {
        toast.error("Please fill in all required fields");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      // Generate strategy
      generateStrategyMutation.mutate(formData);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const progressPercentage = (step / 3) * 100;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Campaign Strategy Generator
          </DialogTitle>
          <DialogDescription>
            Let AI create an optimized campaign structure based on your goals
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Step {step} of 3</span>
            <span>{progressPercentage.toFixed(0)}% Complete</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Step 1: Product & Marketplace */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="asin">Product ASIN *</Label>
                <Input
                  id="asin"
                  placeholder="B08N5WRWNW"
                  value={formData.asin}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      asin: e.target.value.toUpperCase(),
                    })
                  }
                  maxLength={10}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="marketplace">Marketplace *</Label>
                <Select
                  value={formData.marketplace}
                  onValueChange={(value) =>
                    setFormData({ ...formData, marketplace: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="UK">United Kingdom</SelectItem>
                    <SelectItem value="DE">Germany</SelectItem>
                    <SelectItem value="FR">France</SelectItem>
                    <SelectItem value="IT">Italy</SelectItem>
                    <SelectItem value="ES">Spain</SelectItem>
                    <SelectItem value="JP">Japan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Goals & Budget */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="targetAcos">Target ACOS (%)</Label>
                <Input
                  id="targetAcos"
                  type="number"
                  step="0.1"
                  value={formData.targetAcos}
                  onChange={(e) =>
                    setFormData({ ...formData, targetAcos: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Typical range: 15-35%
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dailyBudget">Daily Budget ($)</Label>
                <Input
                  id="dailyBudget"
                  type="number"
                  step="1"
                  value={formData.dailyBudget}
                  onChange={(e) =>
                    setFormData({ ...formData, dailyBudget: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="rankGoal">Organic Rank Goal</Label>
                <Input
                  id="rankGoal"
                  type="number"
                  placeholder="10"
                  value={formData.rankGoal}
                  onChange={(e) =>
                    setFormData({ ...formData, rankGoal: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Target organic search ranking position
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="aggressiveness">Strategy Aggressiveness</Label>
                <Select
                  value={formData.aggressiveness}
                  onValueChange={(value) =>
                    setFormData({ ...formData, aggressiveness: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">
                      Conservative - Lower risk, slower growth
                    </SelectItem>
                    <SelectItem value="moderate">
                      Moderate - Balanced approach
                    </SelectItem>
                    <SelectItem value="aggressive">
                      Aggressive - High visibility, faster results
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-between gap-2 pt-4">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={generateStrategyMutation.isPending}
              >
                {generateStrategyMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Strategy...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Strategy
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review Strategy */}
        {step === 3 && strategy && (
          <div className="space-y-4">
            {/* Campaign Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Campaign Structure</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Campaign Name</p>
                  <p className="font-semibold">
                    {strategy.campaignStructure.name}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <Badge>{strategy.campaignStructure.type}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Daily Budget
                    </p>
                    <p className="font-semibold">
                      ${strategy.campaignStructure.dailyBudget.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Ad Groups ({strategy.campaignStructure.adGroups.length})
                  </p>
                  {strategy.campaignStructure.adGroups.map((ag, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-1.5 px-3 bg-gray-50 rounded mb-1"
                    >
                      <span className="text-sm">{ag.name}</span>
                      <Badge variant="outline">
                        {ag.keywords.length} keywords
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Projected Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Projected Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Est. Clicks
                      </p>
                      <p className="text-lg font-bold">
                        {strategy.projectedMetrics.estimatedClicks.toFixed(0)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded">
                      <DollarSign className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Est. Sales
                      </p>
                      <p className="text-lg font-bold text-green-600">
                        ${strategy.projectedMetrics.estimatedSales.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded">
                      <Target className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Est. ACOS</p>
                      <p className="text-lg font-bold">
                        {strategy.projectedMetrics.estimatedAcos.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Est. Rank</p>
                      <p className="text-lg font-bold">
                        #{strategy.projectedMetrics.estimatedRank}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {strategy.aiRecommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
                <Separator className="my-3" />
                <p className="text-sm text-muted-foreground">
                  {strategy.reasoning}
                </p>
              </CardContent>
            </Card>

            <div className="flex justify-between gap-2 pt-4">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => applyStrategyMutation.mutate()}
                disabled={applyStrategyMutation.isPending}
                className="bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {applyStrategyMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Campaign...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Apply Strategy
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
