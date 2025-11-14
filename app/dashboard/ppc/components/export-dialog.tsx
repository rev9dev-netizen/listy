"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Download,
  FileText,
  Database,
  BarChart3,
  Calendar,
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ExportDialog({
  open,
  onOpenChange,
}: ExportDialogProps) {
  const [exportType, setExportType] = useState<string>("campaigns");
  const [format, setFormat] = useState<string>("csv");
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [includeMetrics, setIncludeMetrics] = useState(true);

  const defaultEndDate = new Date();
  const defaultStartDate = new Date(defaultEndDate);
  defaultStartDate.setDate(defaultStartDate.getDate() - 30);

  const [dateRange, setDateRange] = useState({
    start: defaultStartDate.toISOString().split("T")[0],
    end: defaultEndDate.toISOString().split("T")[0],
  });

  // Fetch campaigns for selection
  const { data: campaignsData } = useQuery({
    queryKey: ["ppc-campaigns"],
    queryFn: async () => {
      const response = await fetch("/api/ppc/campaigns");
      if (!response.ok) throw new Error("Failed to fetch campaigns");
      return response.json();
    },
    enabled: open,
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/ppc/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exportType,
          format,
          campaignIds: selectedCampaigns,
          includeMetrics,
          dateRange,
        }),
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      if (format === "csv") {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${exportType}_export_${
          new Date().toISOString().split("T")[0]
        }.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return { success: true, message: "CSV downloaded" };
      } else {
        return await response.json();
      }
    },
    onSuccess: (data) => {
      if (format === "json") {
        // Download JSON
        const blob = new Blob([JSON.stringify(data.data, null, 2)], {
          type: "application/json",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${exportType}_export_${
          new Date().toISOString().split("T")[0]
        }.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      toast.success(`${exportType} exported successfully`);
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to export data");
    },
  });

  const campaigns = campaignsData?.campaigns || [];

  const handleCampaignToggle = (campaignId: string) => {
    setSelectedCampaigns((prev) =>
      prev.includes(campaignId)
        ? prev.filter((id) => id !== campaignId)
        : [...prev, campaignId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCampaigns.length === campaigns.length) {
      setSelectedCampaigns([]);
    } else {
      setSelectedCampaigns(campaigns.map((c: { id: string }) => c.id));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-500" />
            Export PPC Data
          </DialogTitle>
          <DialogDescription>
            Export campaigns, keywords, or metrics data in CSV or JSON format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Type */}
          <div className="space-y-2">
            <Label>What do you want to export?</Label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setExportType("campaigns")}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  exportType === "campaigns"
                    ? "border-blue-500 bg-blue-50"
                    : "hover:border-gray-400"
                }`}
              >
                <Database className="w-5 h-5 mb-2 text-blue-500" />
                <div className="font-medium">Campaigns</div>
                <div className="text-xs text-muted-foreground">
                  Campaign details & structure
                </div>
              </button>

              <button
                onClick={() => setExportType("keywords")}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  exportType === "keywords"
                    ? "border-blue-500 bg-blue-50"
                    : "hover:border-gray-400"
                }`}
              >
                <FileText className="w-5 h-5 mb-2 text-green-500" />
                <div className="font-medium">Keywords</div>
                <div className="text-xs text-muted-foreground">
                  All keywords with metrics
                </div>
              </button>

              <button
                onClick={() => setExportType("metrics")}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  exportType === "metrics"
                    ? "border-blue-500 bg-blue-50"
                    : "hover:border-gray-400"
                }`}
              >
                <BarChart3 className="w-5 h-5 mb-2 text-purple-500" />
                <div className="font-medium">Metrics</div>
                <div className="text-xs text-muted-foreground">
                  Daily performance data
                </div>
              </button>
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Excel-compatible)</SelectItem>
                <SelectItem value="json">JSON (API-compatible)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date Range
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Start Date
                </Label>
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, start: e.target.value })
                  }
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  End Date
                </Label>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, end: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Campaign Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Select Campaigns</Label>
              <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                {selectedCampaigns.length === campaigns.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </div>
            <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
              {campaigns.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No campaigns available
                </p>
              ) : (
                campaigns.map(
                  (campaign: { id: string; campaignName: string }) => (
                    <div
                      key={campaign.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={campaign.id}
                        checked={selectedCampaigns.includes(campaign.id)}
                        onCheckedChange={() =>
                          handleCampaignToggle(campaign.id)
                        }
                      />
                      <label
                        htmlFor={campaign.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {campaign.campaignName}
                      </label>
                    </div>
                  )
                )
              )}
            </div>
            {campaigns.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedCampaigns.length === 0
                  ? "All campaigns will be exported"
                  : `${selectedCampaigns.length} campaign(s) selected`}
              </p>
            )}
          </div>

          {/* Options */}
          <div className="space-y-2">
            <Label>Options</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeMetrics"
                checked={includeMetrics}
                onCheckedChange={(checked) =>
                  setIncludeMetrics(checked as boolean)
                }
              />
              <label
                htmlFor="includeMetrics"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Include performance metrics (last 30 days)
              </label>
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm space-y-1">
              <p>
                <strong>Export Summary:</strong>
              </p>
              <p>
                • Type: <Badge variant="secondary">{exportType}</Badge>
              </p>
              <p>
                • Format:{" "}
                <Badge variant="secondary">{format.toUpperCase()}</Badge>
              </p>
              <p>
                • Date Range: {new Date(dateRange.start).toLocaleDateString()} -{" "}
                {new Date(dateRange.end).toLocaleDateString()}
              </p>
              {selectedCampaigns.length > 0 && (
                <p>• Campaigns: {selectedCampaigns.length} selected</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
          >
            <Download className="w-4 h-4 mr-2" />
            {exportMutation.isPending ? "Exporting..." : "Export Now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
