"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import {
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Sparkles,
  Target,
  Zap,
  AlertCircle,
} from "lucide-react";

interface AuditResultsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  campaignName: string;
}

interface Issue {
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  impact: string;
  recommendation: string;
}

interface Opportunity {
  type: string;
  title: string;
  description: string;
  potentialImpact: string;
  effort: "low" | "medium" | "high";
}

interface KeywordAnalysis {
  keyword: string;
  qualityScore: number;
  issues: string[];
  opportunities: string[];
}

interface AuditReport {
  overallScore: number;
  issues: Issue[];
  opportunities: Opportunity[];
  keywordAnalysis: KeywordAnalysis[];
  quickWins: string[];
  summary: string;
}

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case "critical":
      return <XCircle className="w-5 h-5 text-red-600" />;
    case "warning":
      return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    case "info":
      return <AlertCircle className="w-5 h-5 text-blue-600" />;
    default:
      return null;
  }
};

const getSeverityBadge = (severity: string) => {
  switch (severity) {
    case "critical":
      return <Badge variant="destructive">Critical</Badge>;
    case "warning":
      return <Badge className="bg-yellow-100 text-yellow-700">Warning</Badge>;
    case "info":
      return <Badge variant="outline">Info</Badge>;
    default:
      return null;
  }
};

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-600";
};

const getScoreGrade = (score: number) => {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
};

export default function AuditResultsModal({
  open,
  onOpenChange,
  campaignId,
  campaignName,
}: AuditResultsModalProps) {
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);

  const auditMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/ppc/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to run audit");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setAuditReport(data.report);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to run audit");
    },
  });

  // Auto-run audit when modal opens
  useState(() => {
    if (open && !auditReport && !auditMutation.isPending) {
      auditMutation.mutate();
    }
  });

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => setAuditReport(null), 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Campaign Audit Results
          </DialogTitle>
          <DialogDescription>
            AI-powered analysis for &quot;{campaignName}&quot;
          </DialogDescription>
        </DialogHeader>

        {auditMutation.isPending && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600 mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              AI is analyzing your campaign...
            </p>
            <p className="text-xs text-muted-foreground">
              Checking keywords, bids, budgets, and performance metrics
            </p>
          </div>
        )}

        {auditMutation.isError && (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">
              Failed to generate audit report. Please try again.
            </p>
            <Button onClick={() => auditMutation.mutate()}>Retry Audit</Button>
          </div>
        )}

        {auditReport && (
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {/* Overall Score */}
              <Card className="bg-linear-to-br from-purple-50 to-blue-50 border-purple-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Overall Health Score
                      </p>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-5xl font-bold ${getScoreColor(
                            auditReport.overallScore
                          )}`}
                        >
                          {auditReport.overallScore}
                        </span>
                        <div>
                          <Badge
                            variant="outline"
                            className="text-lg font-semibold"
                          >
                            {getScoreGrade(auditReport.overallScore)}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            out of 100
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="w-32 space-y-2">
                        <Progress
                          value={auditReport.overallScore}
                          className="h-3"
                        />
                        <p className="text-xs text-muted-foreground">
                          {auditReport.overallScore >= 80
                            ? "Excellent performance!"
                            : auditReport.overallScore >= 60
                            ? "Room for improvement"
                            : "Needs attention"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Executive Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {auditReport.summary}
                  </p>
                </CardContent>
              </Card>

              {/* Quick Wins */}
              {auditReport.quickWins.length > 0 && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="w-5 h-5 text-green-600" />
                      Quick Wins
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {auditReport.quickWins.map((win, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm"
                        >
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                          <span>{win}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Issues */}
              {auditReport.issues.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Issues Found ({auditReport.issues.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {auditReport.issues.map((issue, idx) => (
                        <AccordionItem key={idx} value={`issue-${idx}`}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-3 text-left">
                              {getSeverityIcon(issue.severity)}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">
                                    {issue.title}
                                  </span>
                                  {getSeverityBadge(issue.severity)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Impact: {issue.impact}
                                </p>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-3 pl-8 pr-4">
                              <div>
                                <p className="text-sm font-medium mb-1">
                                  Description:
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {issue.description}
                                </p>
                              </div>
                              <Separator />
                              <div>
                                <p className="text-sm font-medium mb-1 flex items-center gap-2">
                                  <Target className="w-4 h-4" />
                                  Recommendation:
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {issue.recommendation}
                                </p>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              )}

              {/* Opportunities */}
              {auditReport.opportunities.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Growth Opportunities ({auditReport.opportunities.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {auditReport.opportunities.map((opp, idx) => (
                        <div
                          key={idx}
                          className="p-4 border rounded-lg hover:border-purple-300 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <Badge variant="outline" className="mb-2">
                                {opp.type}
                              </Badge>
                              <h4 className="font-semibold">{opp.title}</h4>
                            </div>
                            <Badge
                              variant={
                                opp.effort === "low"
                                  ? "default"
                                  : opp.effort === "medium"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {opp.effort} effort
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {opp.description}
                          </p>
                          <p className="text-sm font-medium text-green-600">
                            💡 {opp.potentialImpact}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Keyword Analysis */}
              {auditReport.keywordAnalysis.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Keyword Analysis ({auditReport.keywordAnalysis.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {auditReport.keywordAnalysis
                        .slice(0, 10)
                        .map((kw, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 border rounded"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">
                                  {kw.keyword}
                                </span>
                                <Badge
                                  variant={
                                    kw.qualityScore >= 71
                                      ? "default"
                                      : kw.qualityScore >= 51
                                      ? "secondary"
                                      : "destructive"
                                  }
                                >
                                  {kw.qualityScore}
                                </Badge>
                              </div>
                              {kw.issues.length > 0 && (
                                <p className="text-xs text-red-600">
                                  ⚠️ {kw.issues.join(", ")}
                                </p>
                              )}
                              {kw.opportunities.length > 0 && (
                                <p className="text-xs text-green-600">
                                  ✨ {kw.opportunities.join(", ")}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      {auditReport.keywordAnalysis.length > 10 && (
                        <p className="text-xs text-muted-foreground text-center pt-2">
                          Showing top 10 keywords. Full analysis includes{" "}
                          {auditReport.keywordAnalysis.length} keywords.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        )}

        {auditReport && (
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
            <Button onClick={() => auditMutation.mutate()}>
              <Sparkles className="w-4 h-4 mr-2" />
              Re-run Audit
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
