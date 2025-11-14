"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { toast } from "sonner";
import {
  History,
  TrendingUp,
  TrendingDown,
  Undo2,
  User,
  Bot,
} from "lucide-react";
import { format } from "date-fns";

interface BidHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keywordId: string;
  keywordText: string;
}

interface BidHistoryRecord {
  id: string;
  keywordId: string;
  oldBid: number;
  newBid: number;
  reason: string | null;
  changedBy: string;
  ruleApplied: string | null;
  createdAt: string;
  keyword: {
    keyword: string;
    adGroup: {
      name: string;
      campaign: {
        id: string;
        name: string;
      };
    };
  };
}

export function BidHistoryDialog({
  open,
  onOpenChange,
  keywordId,
  keywordText,
}: BidHistoryDialogProps) {
  const queryClient = useQueryClient();

  // Fetch bid history
  const { data: bidHistory, isLoading } = useQuery({
    queryKey: ["bidHistory", keywordId],
    queryFn: async () => {
      const res = await fetch(`/api/ppc/bid-history?keywordId=${keywordId}`);
      if (!res.ok) throw new Error("Failed to fetch bid history");
      return res.json() as Promise<BidHistoryRecord[]>;
    },
    enabled: open && !!keywordId,
  });

  // Rollback mutation
  const rollbackMutation = useMutation({
    mutationFn: async (historyId: string) => {
      const res = await fetch("/api/ppc/bid-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ historyId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to rollback bid");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bidHistory", keywordId] });
      queryClient.invalidateQueries({ queryKey: ["keywords"] });
      toast.success(data.message);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Prepare chart data
  const chartData =
    bidHistory?.map((record) => ({
      date: format(new Date(record.createdAt), "MMM dd, HH:mm"),
      bid: record.newBid,
      fullDate: format(new Date(record.createdAt), "PPpp"),
    })) || [];

  // Reverse for chronological order in chart
  const chronologicalChartData = [...chartData].reverse();

  // Calculate statistics
  const stats = bidHistory
    ? {
        totalChanges: bidHistory.length,
        currentBid: bidHistory[0]?.newBid || 0,
        highestBid: Math.max(
          ...bidHistory.map((r) => Math.max(r.oldBid, r.newBid))
        ),
        lowestBid: Math.min(
          ...bidHistory.map((r) => Math.min(r.oldBid, r.newBid))
        ),
        avgBid:
          bidHistory.reduce((sum, r) => sum + r.newBid, 0) / bidHistory.length,
        automatedChanges: bidHistory.filter((r) => r.changedBy === "System")
          .length,
        manualChanges: bidHistory.filter((r) => r.changedBy === "User").length,
      }
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Bid History
          </DialogTitle>
          <DialogDescription>
            Keyword: <span className="font-medium">{keywordText}</span>
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            Loading bid history...
          </div>
        )}

        {!isLoading && bidHistory && bidHistory.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No bid history found for this keyword
          </div>
        )}

        {!isLoading && bidHistory && bidHistory.length > 0 && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Changes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.totalChanges}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.automatedChanges} auto / {stats?.manualChanges}{" "}
                    manual
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Current Bid
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${stats?.currentBid.toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Highest Bid
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ${stats?.highestBid.toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Lowest Bid
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    ${stats?.lowestBid.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bid Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Bid Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chronologicalChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      label={{
                        value: "Bid ($)",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border rounded-lg shadow-lg p-3">
                              <p className="text-sm font-medium">
                                ${payload[0].value?.toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {payload[0].payload.fullDate}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="bid"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="Bid Amount"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* History Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Old Bid</TableHead>
                    <TableHead>New Bid</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Changed By</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bidHistory.map((record, index) => {
                    const change = record.newBid - record.oldBid;
                    const changePercent =
                      record.oldBid > 0
                        ? ((change / record.oldBid) * 100).toFixed(1)
                        : "0.0";
                    const isIncrease = change > 0;

                    return (
                      <TableRow key={record.id}>
                        <TableCell className="text-sm">
                          {format(
                            new Date(record.createdAt),
                            "MMM dd, yyyy HH:mm"
                          )}
                        </TableCell>
                        <TableCell className="font-mono">
                          ${record.oldBid.toFixed(2)}
                        </TableCell>
                        <TableCell className="font-mono font-medium">
                          ${record.newBid.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {isIncrease ? (
                              <TrendingUp className="h-3 w-3 text-green-600" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-600" />
                            )}
                            <span
                              className={
                                isIncrease ? "text-green-600" : "text-red-600"
                              }
                            >
                              {isIncrease ? "+" : ""}
                              {changePercent}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              record.changedBy === "System"
                                ? "secondary"
                                : "default"
                            }
                          >
                            {record.changedBy === "System" ? (
                              <Bot className="h-3 w-3 mr-1" />
                            ) : (
                              <User className="h-3 w-3 mr-1" />
                            )}
                            {record.changedBy}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                          {record.reason || "—"}
                          {record.ruleApplied && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {record.ruleApplied}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {index > 0 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => rollbackMutation.mutate(record.id)}
                              disabled={rollbackMutation.isPending}
                              title="Rollback to this bid"
                            >
                              <Undo2 className="h-3 w-3" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
