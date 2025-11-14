"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

interface CreateCampaignDialogProps {
  children?: React.ReactNode;
}

export function CreateCampaignDialog({ children }: CreateCampaignDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    campaignName: "",
    campaignType: "SponsoredProducts",
    targetingType: "Manual",
    dailyBudget: "10",
    targetAcos: "30",
    asin: "",
    marketplace: "US",
    startDate: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/ppc/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignName: formData.campaignName,
          campaignType: formData.campaignType,
          targetingType: formData.targetingType,
          dailyBudget: parseFloat(formData.dailyBudget),
          targetAcos: parseFloat(formData.targetAcos),
          asin: formData.asin,
          marketplace: formData.marketplace,
          startDate: new Date(formData.startDate),
          status: "Active",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create campaign");
      }

      const data = await response.json();

      toast.success("Campaign created successfully!", {
        description: `${data.campaign.campaignName} is now active`,
      });

      setOpen(false);
      router.refresh();

      // Reset form
      setFormData({
        campaignName: "",
        campaignType: "SponsoredProducts",
        targetingType: "Manual",
        dailyBudget: "10",
        targetAcos: "30",
        asin: "",
        marketplace: "US",
        startDate: new Date().toISOString().split("T")[0],
      });
    } catch (error) {
      console.error("Failed to create campaign:", error);
      toast.error("Failed to create campaign", {
        description: "Please try again or check your inputs",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Sparkles className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create PPC Campaign</DialogTitle>
          <DialogDescription>
            Set up a new Amazon PPC campaign with AI-powered optimization
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campaign Name */}
          <div className="space-y-2">
            <Label htmlFor="campaignName">Campaign Name *</Label>
            <Input
              id="campaignName"
              placeholder="e.g., Wireless Charger - Brand Campaign"
              value={formData.campaignName}
              onChange={(e) =>
                setFormData({ ...formData, campaignName: e.target.value })
              }
              required
            />
          </div>

          {/* ASIN */}
          <div className="space-y-2">
            <Label htmlFor="asin">Product ASIN *</Label>
            <Input
              id="asin"
              placeholder="e.g., B08XYZ1234"
              value={formData.asin}
              onChange={(e) =>
                setFormData({ ...formData, asin: e.target.value.toUpperCase() })
              }
              maxLength={10}
              required
            />
          </div>

          {/* Campaign Type */}
          <div className="space-y-2">
            <Label htmlFor="campaignType">Campaign Type</Label>
            <Select
              value={formData.campaignType}
              onValueChange={(value) =>
                setFormData({ ...formData, campaignType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SponsoredProducts">
                  Sponsored Products
                </SelectItem>
                <SelectItem value="SponsoredBrands">
                  Sponsored Brands
                </SelectItem>
                <SelectItem value="SponsoredDisplay">
                  Sponsored Display
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Targeting Type */}
          <div className="space-y-2">
            <Label htmlFor="targetingType">Targeting Type</Label>
            <Select
              value={formData.targetingType}
              onValueChange={(value) =>
                setFormData({ ...formData, targetingType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Auto">Automatic</SelectItem>
                <SelectItem value="Manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Marketplace */}
          <div className="space-y-2">
            <Label htmlFor="marketplace">Marketplace</Label>
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
                <SelectItem value="US">United States (US)</SelectItem>
                <SelectItem value="CA">Canada (CA)</SelectItem>
                <SelectItem value="UK">United Kingdom (UK)</SelectItem>
                <SelectItem value="DE">Germany (DE)</SelectItem>
                <SelectItem value="FR">France (FR)</SelectItem>
                <SelectItem value="IT">Italy (IT)</SelectItem>
                <SelectItem value="ES">Spain (ES)</SelectItem>
                <SelectItem value="JP">Japan (JP)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Daily Budget */}
          <div className="space-y-2">
            <Label htmlFor="dailyBudget">Daily Budget ($) *</Label>
            <Input
              id="dailyBudget"
              type="number"
              min="1"
              step="0.01"
              placeholder="10.00"
              value={formData.dailyBudget}
              onChange={(e) =>
                setFormData({ ...formData, dailyBudget: e.target.value })
              }
              required
            />
          </div>

          {/* Target ACOS */}
          <div className="space-y-2">
            <Label htmlFor="targetAcos">Target ACOS (%) *</Label>
            <Input
              id="targetAcos"
              type="number"
              min="1"
              max="100"
              step="0.1"
              placeholder="30.0"
              value={formData.targetAcos}
              onChange={(e) =>
                setFormData({ ...formData, targetAcos: e.target.value })
              }
              required
            />
            <p className="text-sm text-muted-foreground">
              AI will optimize bids to stay within this target
            </p>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              required
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Campaign"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
