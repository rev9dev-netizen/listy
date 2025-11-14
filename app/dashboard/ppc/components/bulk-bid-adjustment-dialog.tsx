"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Pause,
  Play,
} from "lucide-react";

interface BulkBidAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedKeywordIds: string[];
  onSuccess?: () => void;
}

export default function BulkBidAdjustmentDialog({
  open,
  onOpenChange,
  selectedKeywordIds,
  onSuccess,
}: BulkBidAdjustmentDialogProps) {
  const queryClient = useQueryClient();
  const [action, setAction] = useState<string>("increaseByPercent");
  const [value, setValue] = useState<string>("");

  const bulkUpdateMutation = useMutation({
    mutationFn: async (data: {
      keywordIds: string[];
      action: string;
      value?: number;
    }) => {
      const response = await fetch("/api/ppc/keywords/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update keywords");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ppc-keywords"] });
      toast.success(`Successfully updated ${data.keywords.length} keywords`);
      onOpenChange(false);
      setValue("");
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update keywords");
    },
  });

  const handleSubmit = () => {
    if (selectedKeywordIds.length === 0) {
      toast.error("No keywords selected");
      return;
    }

    // Validate value for actions that require it
    if (
      ["increaseByPercent", "decreaseByPercent", "setSpecificBid"].includes(
        action
      )
    ) {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue <= 0) {
        toast.error("Please enter a valid positive number");
        return;
      }

      if (action === "setSpecificBid" && numValue < 0.02) {
        toast.error("Bid must be at least $0.02");
        return;
      }

      bulkUpdateMutation.mutate({
        keywordIds: selectedKeywordIds,
        action,
        value: numValue,
      });
    } else {
      // Pause or Resume action
      bulkUpdateMutation.mutate({
        keywordIds: selectedKeywordIds,
        action,
      });
    }
  };

  const getActionIcon = () => {
    switch (action) {
      case "increaseByPercent":
        return <TrendingUp className="w-4 h-4" />;
      case "decreaseByPercent":
        return <TrendingDown className="w-4 h-4" />;
      case "setSpecificBid":
        return <DollarSign className="w-4 h-4" />;
      case "pause":
        return <Pause className="w-4 h-4" />;
      case "resume":
        return <Play className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const requiresValue = [
    "increaseByPercent",
    "decreaseByPercent",
    "setSpecificBid",
  ].includes(action);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bulk Bid Adjustment</DialogTitle>
          <DialogDescription>
            Apply changes to {selectedKeywordIds.length} selected keyword
            {selectedKeywordIds.length !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="action">Action</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger id="action">
                <div className="flex items-center gap-2">
                  {getActionIcon()}
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="increaseByPercent">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Increase by Percentage
                  </div>
                </SelectItem>
                <SelectItem value="decreaseByPercent">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" />
                    Decrease by Percentage
                  </div>
                </SelectItem>
                <SelectItem value="setSpecificBid">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Set Specific Bid
                  </div>
                </SelectItem>
                <SelectItem value="pause">
                  <div className="flex items-center gap-2">
                    <Pause className="w-4 h-4" />
                    Pause Keywords
                  </div>
                </SelectItem>
                <SelectItem value="resume">
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    Resume Keywords
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {requiresValue && (
            <div className="space-y-2">
              <Label htmlFor="value">
                {action === "setSpecificBid"
                  ? "Bid Amount ($)"
                  : "Percentage (%)"}
              </Label>
              <Input
                id="value"
                type="number"
                step={action === "setSpecificBid" ? "0.01" : "1"}
                min={action === "setSpecificBid" ? "0.02" : "1"}
                placeholder={
                  action === "setSpecificBid" ? "e.g., 1.50" : "e.g., 10"
                }
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
              {action === "increaseByPercent" && (
                <p className="text-xs text-muted-foreground">
                  Each keyword&apos;s bid will be increased by this percentage
                </p>
              )}
              {action === "decreaseByPercent" && (
                <p className="text-xs text-muted-foreground">
                  Each keyword&apos;s bid will be decreased by this percentage
                  (minimum $0.02)
                </p>
              )}
              {action === "setSpecificBid" && (
                <p className="text-xs text-muted-foreground">
                  All selected keywords will be set to this exact bid amount
                </p>
              )}
            </div>
          )}

          {!requiresValue && (
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm">
                {action === "pause"
                  ? "All selected keywords will be paused and stop showing ads."
                  : "All selected keywords will be resumed and start showing ads again."}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={bulkUpdateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={bulkUpdateMutation.isPending}
          >
            {bulkUpdateMutation.isPending ? "Applying..." : "Apply Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
