"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ArrowLeft,
  Plus,
  MoreVertical,
  Power,
  PowerOff,
  Trash2,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import CreateAutomationRuleDialog from "../components/create-automation-rule-dialog";

interface AutomationRule {
  id: string;
  name: string;
  type: string;
  conditions: {
    metric: string;
    operator: string;
    threshold: number;
  }[];
  actions: {
    type: string;
    value: number | string;
  }[];
  isActive: boolean;
  priority: number;
  lastRun: string | null;
  runsCount: number;
  campaign?: {
    id: string;
    campaignName: string;
  };
}

export default function AutomationPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch automation rules
  const { data: rulesData, isLoading } = useQuery({
    queryKey: ["automation-rules"],
    queryFn: async () => {
      const response = await fetch("/api/ppc/automation/rules");
      if (!response.ok) throw new Error("Failed to fetch automation rules");
      return response.json();
    },
  });

  // Toggle rule active status
  const toggleRuleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await fetch("/api/ppc/automation/rules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive }),
      });
      if (!response.ok) throw new Error("Failed to update rule");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      toast.success("Rule status updated");
    },
    onError: () => {
      toast.error("Failed to update rule");
    },
  });

  const rules: AutomationRule[] = rulesData?.rules || [];

  const getRuleTypeBadge = (type: string) => {
    const badges: Record<
      string,
      {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
      }
    > = {
      BidAdjustment: { label: "Bid Adjustment", variant: "default" },
      PauseKeyword: { label: "Pause Keyword", variant: "destructive" },
      BudgetShift: { label: "Budget Shift", variant: "secondary" },
      ConversionGuard: { label: "Conversion Guard", variant: "outline" },
    };
    const badge = badges[type] || { label: type, variant: "outline" as const };
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
  };

  const formatConditions = (conditions: AutomationRule["conditions"]) => {
    return conditions
      .map(
        (c) =>
          `${c.metric} ${c.operator} ${c.threshold}${
            c.metric.toLowerCase().includes("acos") ? "%" : ""
          }`
      )
      .join(" AND ");
  };

  const formatActions = (actions: AutomationRule["actions"]) => {
    return actions
      .map((a) => {
        if (a.type === "AdjustBid") return `Adjust bid by ${a.value}%`;
        if (a.type === "PauseKeyword") return "Pause keyword";
        if (a.type === "IncreaseBudget")
          return `Increase budget by ${a.value}%`;
        if (a.type === "SendAlert") return `Send alert: ${a.value}`;
        return a.type;
      })
      .join(", ");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/ppc")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Automation Rules</h1>
            <p className="text-muted-foreground">
              Set up automatic bid adjustments, keyword pausing, and budget
              shifts
            </p>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Rule
        </Button>
      </div>

      {/* Create Rule Dialog */}
      <CreateAutomationRuleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          setDialogOpen(false);
          queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
        }}
      />

      {/* Rules Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rules.length}</div>
            <p className="text-xs text-muted-foreground">
              All automation rules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {rules.filter((r) => r.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rules.reduce((sum, r) => sum + r.runsCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Actions executed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">High</div>
            <p className="text-xs text-muted-foreground">Automation impact</p>
          </CardContent>
        </Card>
      </div>

      {/* Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Automation Rules</CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No automation rules yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Create your first rule to automate bid adjustments and campaign
                management
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Rule
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Conditions</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Runs</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>{getRuleTypeBadge(rule.type)}</TableCell>
                    <TableCell>
                      {rule.campaign ? (
                        <span className="text-sm">
                          {rule.campaign.campaignName}
                        </span>
                      ) : (
                        <Badge variant="outline">All Campaigns</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm max-w-xs truncate">
                      {formatConditions(rule.conditions)}
                    </TableCell>
                    <TableCell className="text-sm max-w-xs truncate">
                      {formatActions(rule.actions)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{rule.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      {rule.isActive ? (
                        <Badge variant="default" className="bg-green-600">
                          <Power className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <PowerOff className="w-3 h-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{rule.runsCount}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              toggleRuleMutation.mutate({
                                id: rule.id,
                                isActive: !rule.isActive,
                              })
                            }
                          >
                            {rule.isActive ? (
                              <>
                                <PowerOff className="w-4 h-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Power className="w-4 h-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
