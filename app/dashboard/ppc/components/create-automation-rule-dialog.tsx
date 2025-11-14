"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Badge } from "@/components/ui/badge";
import { Plus, X, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface CreateAutomationRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Condition {
  metric: string;
  operator: string;
  threshold: number;
}

interface Action {
  type: string;
  value: number | string;
}

export default function CreateAutomationRuleDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateAutomationRuleDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("BidAdjustment");
  const [campaignId, setCampaignId] = useState<string>("");
  const [priority, setPriority] = useState(5);
  const [conditions, setConditions] = useState<Condition[]>([
    { metric: "ACOS", operator: ">", threshold: 30 },
  ]);
  const [actions, setActions] = useState<Action[]>([
    { type: "AdjustBid", value: -10 },
  ]);

  // Fetch campaigns for dropdown
  const { data: campaignsData } = useQuery({
    queryKey: ["ppc-campaigns"],
    queryFn: async () => {
      const response = await fetch("/api/ppc/campaigns");
      if (!response.ok) throw new Error("Failed to fetch campaigns");
      return response.json();
    },
    enabled: open,
  });

  // Create rule mutation
  const createRuleMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/ppc/automation/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          campaignId: campaignId || null,
          priority,
          conditions,
          actions,
          isActive: true,
        }),
      });
      if (!response.ok) throw new Error("Failed to create rule");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Automation rule created successfully");
      resetForm();
      onSuccess();
    },
    onError: () => {
      toast.error("Failed to create automation rule");
    },
  });

  const resetForm = () => {
    setName("");
    setType("BidAdjustment");
    setCampaignId("");
    setPriority(5);
    setConditions([{ metric: "ACOS", operator: ">", threshold: 30 }]);
    setActions([{ type: "AdjustBid", value: -10 }]);
  };

  const addCondition = () => {
    setConditions([
      ...conditions,
      { metric: "ACOS", operator: ">", threshold: 0 },
    ]);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (
    index: number,
    field: keyof Condition,
    value: string | number
  ) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: value };
    setConditions(updated);
  };

  const addAction = () => {
    setActions([...actions, { type: "AdjustBid", value: 0 }]);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const updateAction = (
    index: number,
    field: keyof Action,
    value: string | number
  ) => {
    const updated = [...actions];
    updated[index] = { ...updated[index], [field]: value };
    setActions(updated);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Please enter a rule name");
      return;
    }
    if (conditions.length === 0) {
      toast.error("Please add at least one condition");
      return;
    }
    if (actions.length === 0) {
      toast.error("Please add at least one action");
      return;
    }
    createRuleMutation.mutate();
  };

  const campaigns = campaignsData?.campaigns || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            Create Automation Rule
          </DialogTitle>
          <DialogDescription>
            Set up automatic actions based on campaign performance metrics
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Rule Name *</Label>
              <Input
                id="name"
                placeholder="e.g., High ACOS Protection"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Rule Type *</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BidAdjustment">
                      Bid Adjustment
                    </SelectItem>
                    <SelectItem value="PauseKeyword">Pause Keyword</SelectItem>
                    <SelectItem value="BudgetShift">Budget Shift</SelectItem>
                    <SelectItem value="ConversionGuard">
                      Conversion Guard
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="campaign">Campaign (Optional)</Label>
                <Select value={campaignId} onValueChange={setCampaignId}>
                  <SelectTrigger>
                    <SelectValue placeholder="All campaigns" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Campaigns</SelectItem>
                    {campaigns.map(
                      (c: { id: string; campaignName: string }) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.campaignName}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="priority">Priority (1-10)</Label>
              <Input
                id="priority"
                type="number"
                min={1}
                max={10}
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Higher priority rules run first
              </p>
            </div>
          </div>

          {/* Conditions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Conditions (When) *</Label>
              <Button size="sm" variant="outline" onClick={addCondition}>
                <Plus className="w-3 h-3 mr-1" />
                Add Condition
              </Button>
            </div>
            <div className="space-y-2">
              {conditions.map((condition, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Select
                      value={condition.metric}
                      onValueChange={(value) =>
                        updateCondition(index, "metric", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACOS">ACOS (%)</SelectItem>
                        <SelectItem value="CPC">CPC ($)</SelectItem>
                        <SelectItem value="CTR">CTR (%)</SelectItem>
                        <SelectItem value="ConversionRate">
                          Conversion Rate (%)
                        </SelectItem>
                        <SelectItem value="Spend">Spend ($)</SelectItem>
                        <SelectItem value="Impressions">Impressions</SelectItem>
                        <SelectItem value="Clicks">Clicks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24">
                    <Select
                      value={condition.operator}
                      onValueChange={(value) =>
                        updateCondition(index, "operator", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=">">Greater than</SelectItem>
                        <SelectItem value="<">Less than</SelectItem>
                        <SelectItem value="=">Equals</SelectItem>
                        <SelectItem value=">=">Greater or equal</SelectItem>
                        <SelectItem value="<=">Less or equal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      step="0.01"
                      value={condition.threshold}
                      onChange={(e) =>
                        updateCondition(
                          index,
                          "threshold",
                          parseFloat(e.target.value)
                        )
                      }
                    />
                  </div>
                  {conditions.length > 1 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeCondition(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              {conditions.length > 1 && (
                <Badge variant="secondary" className="text-xs">
                  All conditions must be met (AND logic)
                </Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Actions (Then) *</Label>
              <Button size="sm" variant="outline" onClick={addAction}>
                <Plus className="w-3 h-3 mr-1" />
                Add Action
              </Button>
            </div>
            <div className="space-y-2">
              {actions.map((action, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Select
                      value={action.type}
                      onValueChange={(value) =>
                        updateAction(index, "type", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AdjustBid">
                          Adjust Bid (%)
                        </SelectItem>
                        <SelectItem value="PauseKeyword">
                          Pause Keyword
                        </SelectItem>
                        <SelectItem value="IncreaseBudget">
                          Increase Budget (%)
                        </SelectItem>
                        <SelectItem value="SendAlert">Send Alert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    {action.type === "PauseKeyword" ? (
                      <Input value="Auto-pause" disabled />
                    ) : action.type === "SendAlert" ? (
                      <Input
                        placeholder="Alert message"
                        value={action.value as string}
                        onChange={(e) =>
                          updateAction(index, "value", e.target.value)
                        }
                      />
                    ) : (
                      <Input
                        type="number"
                        step="1"
                        placeholder="Value"
                        value={action.value as number}
                        onChange={(e) =>
                          updateAction(
                            index,
                            "value",
                            parseFloat(e.target.value)
                          )
                        }
                      />
                    )}
                  </div>
                  {actions.length > 1 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeAction(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createRuleMutation.isPending}
            >
              {createRuleMutation.isPending ? "Creating..." : "Create Rule"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
