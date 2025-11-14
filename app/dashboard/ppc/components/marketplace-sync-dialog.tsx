"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Globe,
  ArrowRight,
  AlertCircle,
  Settings,
  CheckCircle,
} from "lucide-react";

interface MarketplaceSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  campaignName: string;
  currentMarketplace?: string;
}

const MARKETPLACES = [
  { code: "US", name: "United States", flag: "🇺🇸", multiplier: 1.0 },
  { code: "UK", name: "United Kingdom", flag: "🇬🇧", multiplier: 0.85 },
  { code: "DE", name: "Germany", flag: "🇩🇪", multiplier: 0.75 },
  { code: "FR", name: "France", flag: "🇫🇷", multiplier: 0.7 },
  { code: "ES", name: "Spain", flag: "🇪🇸", multiplier: 0.65 },
  { code: "IT", name: "Italy", flag: "🇮🇹", multiplier: 0.65 },
  { code: "CA", name: "Canada", flag: "🇨🇦", multiplier: 0.9 },
  { code: "MX", name: "Mexico", flag: "🇲🇽", multiplier: 0.6 },
  { code: "JP", name: "Japan", flag: "🇯🇵", multiplier: 0.95 },
];

export function MarketplaceSyncDialog({
  open,
  onOpenChange,
  campaignId,
  campaignName,
  currentMarketplace = "US",
}: MarketplaceSyncDialogProps) {
  const queryClient = useQueryClient();
  const [targetMarketplace, setTargetMarketplace] = useState("");
  const [adjustBids, setAdjustBids] = useState(true);
  const [customMultiplier, setCustomMultiplier] = useState("");
  const [useCustomMultiplier, setUseCustomMultiplier] = useState(false);

  const cloneCampaignMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/ppc/campaigns/${campaignId}/clone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetMarketplace,
          adjustBids,
          bidMultiplier: useCustomMultiplier
            ? parseFloat(customMultiplier)
            : undefined,
        }),
      });
      const data = await res.json();

      // Check if API is not configured
      if (!res.ok && data.requiresSetup) {
        return data; // Return the setup info
      }

      if (!res.ok) throw new Error(data.error || "Failed to clone campaign");
      return data;
    },
    onSuccess: (data) => {
      if (data.requiresSetup) {
        // Show setup info but don't close dialog
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign cloned to " + targetMarketplace);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const sourceMarketplace = MARKETPLACES.find(
    (m) => m.code === currentMarketplace
  );
  const targetMarketplaceData = MARKETPLACES.find(
    (m) => m.code === targetMarketplace
  );

  const calculatedMultiplier =
    targetMarketplaceData && sourceMarketplace
      ? targetMarketplaceData.multiplier / sourceMarketplace.multiplier
      : 1.0;

  const finalMultiplier =
    useCustomMultiplier && customMultiplier
      ? parseFloat(customMultiplier)
      : calculatedMultiplier;

  const handleClone = () => {
    if (!targetMarketplace) {
      toast.error("Please select a target marketplace");
      return;
    }
    cloneCampaignMutation.mutate();
  };

  const syncResult = cloneCampaignMutation.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Multi-Marketplace Campaign Sync
          </DialogTitle>
          <DialogDescription>
            Clone your campaign to another Amazon marketplace with optimized
            bids
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Source Campaign Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Source Campaign
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Name:</span>
                <span className="font-medium">{campaignName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Marketplace:
                </span>
                <Badge variant="outline">
                  {sourceMarketplace?.flag} {sourceMarketplace?.name}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Target Marketplace Selection */}
          <div className="space-y-3">
            <Label>Target Marketplace</Label>
            <Select
              value={targetMarketplace}
              onValueChange={setTargetMarketplace}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select target marketplace" />
              </SelectTrigger>
              <SelectContent>
                {MARKETPLACES.filter((m) => m.code !== currentMarketplace).map(
                  (marketplace) => (
                    <SelectItem key={marketplace.code} value={marketplace.code}>
                      <span className="flex items-center gap-2">
                        {marketplace.flag} {marketplace.name}
                        <span className="text-muted-foreground text-xs">
                          (×{marketplace.multiplier})
                        </span>
                      </span>
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Sync Flow Visualization */}
          {targetMarketplaceData && (
            <div className="flex items-center justify-center gap-4 py-4">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {sourceMarketplace?.flag} {currentMarketplace}
              </Badge>
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {targetMarketplaceData.flag} {targetMarketplace}
              </Badge>
            </div>
          )}

          <Separator />

          {/* Bid Adjustment Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="adjustBids"
                checked={adjustBids}
                onCheckedChange={(checked) => setAdjustBids(checked === true)}
              />
              <Label
                htmlFor="adjustBids"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Adjust bids for target marketplace
              </Label>
            </div>

            {adjustBids && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Recommended multiplier:
                      </span>
                      <span className="font-medium">
                        ×{calculatedMultiplier.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Based on typical CPC differences between marketplaces
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="customMultiplier"
                      checked={useCustomMultiplier}
                      onCheckedChange={(checked) =>
                        setUseCustomMultiplier(checked === true)
                      }
                    />
                    <Label htmlFor="customMultiplier" className="text-sm">
                      Use custom multiplier
                    </Label>
                  </div>

                  {useCustomMultiplier && (
                    <div className="space-y-2">
                      <Label htmlFor="multiplierInput" className="text-sm">
                        Custom Multiplier
                      </Label>
                      <Input
                        id="multiplierInput"
                        type="number"
                        step="0.01"
                        min="0.1"
                        max="2.0"
                        placeholder="1.0"
                        value={customMultiplier}
                        onChange={(e) => setCustomMultiplier(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        All bids will be multiplied by this value
                      </p>
                    </div>
                  )}

                  {targetMarketplaceData && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Final multiplier:
                        </span>
                        <span className="font-bold text-lg">
                          ×{finalMultiplier.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* API Setup Alert */}
          {syncResult?.requiresSetup && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Amazon Ads API Not Configured</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>{syncResult.message}</p>
                {syncResult.setup && (
                  <div className="mt-4 p-3 bg-muted rounded-md">
                    <p className="font-semibold mb-2">
                      Required Environment Variables:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {syncResult.setup.required?.map((key: string) => (
                        <li key={key}>
                          <code className="text-xs bg-background px-1 py-0.5 rounded">
                            {key}
                          </code>
                        </li>
                      ))}
                    </ul>
                    {syncResult.setup.documentation && (
                      <a
                        href={syncResult.setup.documentation}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline mt-2 inline-flex items-center gap-1"
                      >
                        <Settings className="h-3 w-3" />
                        View API Documentation
                      </a>
                    )}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Preview Info */}
          {syncResult?.preview && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Sync Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground">Ad Groups:</span>
                    <span className="ml-2 font-medium">
                      {syncResult.preview.sourceCampaign.adGroups}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Keywords:</span>
                    <span className="ml-2 font-medium">
                      {syncResult.preview.sourceCampaign.keywords}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Targets:</span>
                    <span className="ml-2 font-medium">
                      {syncResult.preview.sourceCampaign.targets}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Multiplier:</span>
                    <span className="ml-2 font-medium">
                      ×{syncResult.preview.bidAdjustment.multiplier}
                    </span>
                  </div>
                </div>
                {syncResult.preview.estimatedNewBids && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">
                      Estimated new values:
                    </p>
                    <ul className="list-disc list-inside text-xs space-y-1">
                      <li>{syncResult.preview.estimatedNewBids.example}</li>
                      <li>
                        {syncResult.preview.estimatedNewBids.keywordExample}
                      </li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={cloneCampaignMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleClone}
              disabled={!targetMarketplace || cloneCampaignMutation.isPending}
            >
              {cloneCampaignMutation.isPending
                ? "Cloning..."
                : "Clone Campaign"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
