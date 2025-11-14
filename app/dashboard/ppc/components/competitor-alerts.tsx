"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Eye,
  CheckCircle,
  Trash2,
  Target,
  DollarSign,
} from "lucide-react";

interface CompetitorAlert {
  id: string;
  asin: string;
  competitorAsin: string;
  alertType: string;
  message: string;
  severity: string;
  data: {
    oldValue?: number;
    newValue?: number;
    changePercent?: number;
    [key: string]: unknown;
  };
  read: boolean;
  createdAt: string;
}

interface AlertDetailsModalProps {
  alert: CompetitorAlert | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolve: (alertId: string) => void;
  onDelete: (alertId: string) => void;
}

function AlertDetailsModal({
  alert,
  open,
  onOpenChange,
  onResolve,
  onDelete,
}: AlertDetailsModalProps) {
  if (!alert) return null;

  const getRecommendations = () => {
    switch (alert.alertType) {
      case "BidIncrease":
        return [
          "Review your current bid strategy and consider increasing bids to maintain competitiveness",
          "Analyze if the competitor's bid increase is affecting your impression share",
          "Consider dayparting strategies to compete during high-value hours",
        ];
      case "ImpressionLoss":
        return [
          "Increase your bids to regain lost impression share",
          "Review your keyword relevance and quality score",
          "Consider expanding to additional relevant keywords",
        ];
      case "RankDrop":
        return [
          "Optimize your product listing content and images",
          "Improve your product reviews and ratings",
          "Increase advertising budget to boost visibility",
        ];
      case "CPCSpike":
        return [
          "Monitor if the CPC spike is temporary or a trend",
          "Consider negative keywords to improve targeting efficiency",
          "Evaluate if ROI justifies the higher CPC",
        ];
      default:
        return ["Review the alert details and take appropriate action"];
    }
  };

  const getAlertIcon = () => {
    switch (alert.alertType) {
      case "BidIncrease":
        return <TrendingUp className="w-5 h-5 text-orange-500" />;
      case "ImpressionLoss":
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      case "RankDrop":
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      case "CPCSpike":
        return <DollarSign className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getAlertIcon()}
            <DialogTitle>Alert Details</DialogTitle>
          </div>
          <DialogDescription>
            {alert.alertType.replace(/([A-Z])/g, " $1").trim()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Alert Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Your ASIN
              </div>
              <div className="text-lg font-semibold">{alert.asin}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Competitor ASIN
              </div>
              <div className="text-lg font-semibold">
                {alert.competitorAsin}
              </div>
            </div>
            {alert.data?.oldValue !== undefined &&
              alert.data?.newValue !== undefined && (
                <>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Previous Value
                    </div>
                    <div className="text-lg font-semibold">
                      ${alert.data.oldValue.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Current Value
                    </div>
                    <div className="text-lg font-semibold">
                      ${alert.data.newValue.toFixed(2)}
                    </div>
                  </div>
                </>
              )}
            {alert.data?.changePercent !== undefined && (
              <div className="col-span-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Change
                </div>
                <div className="text-lg font-semibold">
                  <Badge
                    variant={
                      alert.data.changePercent > 0 ? "destructive" : "default"
                    }
                  >
                    {alert.data.changePercent > 0 ? "+" : ""}
                    {alert.data.changePercent.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Message */}
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">
              Message
            </div>
            <div className="p-4 bg-muted rounded-lg">{alert.message}</div>
          </div>

          {/* Recommendations */}
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">
              Recommendations
            </div>
            <ul className="space-y-2">
              {getRecommendations().map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Target className="w-4 h-4 mt-0.5 text-blue-500 shrink-0" />
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Timestamp */}
          <div className="text-xs text-muted-foreground">
            Alert created: {new Date(alert.createdAt).toLocaleString()}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onDelete(alert.id)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
          {!alert.read && (
            <Button onClick={() => onResolve(alert.id)}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark as Read
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CompetitorAlerts() {
  const queryClient = useQueryClient();
  const [selectedAlert, setSelectedAlert] = useState<CompetitorAlert | null>(
    null
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("active");

  // Fetch alerts
  const { data: alertsData, isLoading } = useQuery({
    queryKey: ["competitor-alerts", activeTab],
    queryFn: async () => {
      const response = await fetch(
        `/api/ppc/competitor-alerts?status=${activeTab}`
      );
      if (!response.ok) throw new Error("Failed to fetch alerts");
      return response.json();
    },
  });

  // Resolve mutation
  const resolveMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await fetch(`/api/ppc/competitor-alerts/${alertId}`, {
        method: "PATCH",
      });
      if (!response.ok) throw new Error("Failed to resolve alert");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitor-alerts"] });
      toast.success("Alert marked as resolved");
      setShowDetailsModal(false);
    },
    onError: () => {
      toast.error("Failed to resolve alert");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await fetch(`/api/ppc/competitor-alerts/${alertId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete alert");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitor-alerts"] });
      toast.success("Alert deleted successfully");
      setShowDetailsModal(false);
    },
    onError: () => {
      toast.error("Failed to delete alert");
    },
  });

  const handleViewDetails = (alert: CompetitorAlert) => {
    setSelectedAlert(alert);
    setShowDetailsModal(true);
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return <Badge variant="default">Medium</Badge>;
      case "low":
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge>{severity}</Badge>;
    }
  };

  const getAlertTypeIcon = (alertType: string) => {
    switch (alertType) {
      case "BidIncrease":
        return <TrendingUp className="w-4 h-4" />;
      case "ImpressionLoss":
      case "RankDrop":
        return <TrendingDown className="w-4 h-4" />;
      case "CPCSpike":
        return <DollarSign className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const alerts = alertsData?.alerts || [];
  const activeAlerts = alerts.filter((a: CompetitorAlert) => !a.read);
  const resolvedAlerts = alerts.filter((a: CompetitorAlert) => a.read);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Competitor Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-gray-200 rounded" />
            <div className="h-16 bg-gray-200 rounded" />
            <div className="h-16 bg-gray-200 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Competitor Alerts</CardTitle>
          <CardDescription>
            Monitor competitor activity and receive actionable recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">
                Active ({activeAlerts.length})
              </TabsTrigger>
              <TabsTrigger value="resolved">
                Resolved ({resolvedAlerts.length})
              </TabsTrigger>
              <TabsTrigger value="all">All ({alerts.length})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {alerts.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No alerts found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>ASIN</TableHead>
                      <TableHead>Competitor</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Change</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((alert: CompetitorAlert) => (
                      <TableRow key={alert.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getAlertTypeIcon(alert.alertType)}
                            <span className="font-medium">
                              {alert.alertType
                                .replace(/([A-Z])/g, " $1")
                                .trim()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {alert.asin}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {alert.competitorAsin}
                        </TableCell>
                        <TableCell>
                          {getSeverityBadge(alert.severity)}
                        </TableCell>
                        <TableCell>
                          {alert.data?.changePercent !== undefined ? (
                            <Badge
                              variant={
                                alert.data.changePercent > 0
                                  ? "destructive"
                                  : "default"
                              }
                            >
                              {alert.data.changePercent > 0 ? "+" : ""}
                              {alert.data.changePercent.toFixed(1)}%
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(alert.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(alert)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AlertDetailsModal
        alert={selectedAlert}
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        onResolve={(alertId) => resolveMutation.mutate(alertId)}
        onDelete={(alertId) => deleteMutation.mutate(alertId)}
      />
    </>
  );
}
