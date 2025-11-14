"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Search, Plus, MinusCircle, AlertCircle, Settings } from "lucide-react";

interface SearchTermsReportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchTerm {
  searchTerm: string;
  keyword: string;
  matchType: string;
  impressions: number;
  clicks: number;
  ctr: number;
  cost: number;
  cpc: number;
  orders: number;
  sales: number;
  acos: number;
  conversionRate: number;
  addedAsKeyword?: boolean;
  addedAsNegative?: boolean;
}

export function SearchTermsReport({
  open,
  onOpenChange,
}: SearchTermsReportProps) {
  const queryClient = useQueryClient();
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [selectedAdGroup, setSelectedAdGroup] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState("");

  // Fetch campaigns
  const { data: campaigns } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const res = await fetch("/api/ppc/campaigns");
      if (!res.ok) throw new Error("Failed to fetch campaigns");
      return res.json();
    },
  });

  // Fetch ad groups for selected campaign
  const { data: adGroups } = useQuery({
    queryKey: ["adGroups", selectedCampaign],
    queryFn: async () => {
      if (!selectedCampaign) return [];
      const res = await fetch(
        `/api/ppc/ad-groups?campaignId=${selectedCampaign}`
      );
      if (!res.ok) throw new Error("Failed to fetch ad groups");
      return res.json();
    },
    enabled: !!selectedCampaign,
  });

  // Fetch search terms
  const { data: searchTermsData, isLoading } = useQuery({
    queryKey: ["searchTerms", selectedCampaign],
    queryFn: async () => {
      if (!selectedCampaign) return null;
      const res = await fetch(
        `/api/ppc/search-terms?campaignId=${selectedCampaign}`
      );
      const data = await res.json();

      // Check if API is not configured
      if (!res.ok && data.requiresSetup) {
        return {
          requiresSetup: true,
          error: data.error,
          message: data.message,
          setup: data.setup,
        };
      }

      if (!res.ok)
        throw new Error(data.error || "Failed to fetch search terms");
      return data;
    },
    enabled: !!selectedCampaign,
  });

  // Add keyword mutation
  const addKeywordMutation = useMutation({
    mutationFn: async ({
      searchTerm,
      adGroupId,
    }: {
      searchTerm: string;
      adGroupId: string;
    }) => {
      const res = await fetch("/api/ppc/search-terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchTerm,
          adGroupId,
          action: "addKeyword",
          matchType: "Exact",
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to add keyword");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keywords"] });
      toast.success("Added as keyword");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Add negative keyword mutation
  const addNegativeMutation = useMutation({
    mutationFn: async ({
      searchTerm,
      adGroupId,
    }: {
      searchTerm: string;
      adGroupId: string;
    }) => {
      const res = await fetch("/api/ppc/search-terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchTerm,
          adGroupId,
          action: "addNegative",
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to add negative keyword");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["negativeKeywords"] });
      toast.success("Added as negative keyword");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleAddKeyword = (searchTerm: string) => {
    if (!selectedAdGroup) {
      toast.error("Please select an ad group first");
      return;
    }
    addKeywordMutation.mutate({ searchTerm, adGroupId: selectedAdGroup });
  };

  const handleAddNegative = (searchTerm: string) => {
    if (!selectedAdGroup) {
      toast.error("Please select an ad group first");
      return;
    }
    addNegativeMutation.mutate({ searchTerm, adGroupId: selectedAdGroup });
  };

  const filteredSearchTerms = searchTermsData?.searchTerms?.filter(
    (term: SearchTerm) =>
      term.searchTerm.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Terms Report
          </DialogTitle>
          <DialogDescription>
            Analyze customer search queries and add high-performing terms as
            keywords
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Campaign & Ad Group Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Campaign</label>
              <Select
                value={selectedCampaign}
                onValueChange={setSelectedCampaign}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select campaign" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns?.map((campaign: { id: string; name: string }) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Ad Group</label>
              <Select
                value={selectedAdGroup}
                onValueChange={setSelectedAdGroup}
                disabled={!selectedCampaign}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select ad group" />
                </SelectTrigger>
                <SelectContent>
                  {adGroups?.map((adGroup: { id: string; name: string }) => (
                    <SelectItem key={adGroup.id} value={adGroup.id}>
                      {adGroup.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search Filter */}
          <div>
            <Input
              placeholder="Filter by search term..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="max-w-md"
            />
          </div>

          {/* API Configuration Error */}
          {searchTermsData?.requiresSetup && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Amazon Ads API Not Configured</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>{searchTermsData.message}</p>
                {searchTermsData.setup && (
                  <div className="mt-4 p-3 bg-muted rounded-md">
                    <p className="font-semibold mb-2">
                      Required Environment Variables:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {searchTermsData.setup.required?.map((key: string) => (
                        <li key={key}>
                          <code className="text-xs bg-background px-1 py-0.5 rounded">
                            {key}
                          </code>
                        </li>
                      ))}
                    </ul>
                    {searchTermsData.setup.documentation && (
                      <a
                        href={searchTermsData.setup.documentation}
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

          {/* Loading State */}
          {isLoading && selectedCampaign && (
            <div className="text-center py-8 text-muted-foreground">
              Loading search terms...
            </div>
          )}

          {/* No Campaign Selected */}
          {!selectedCampaign && (
            <div className="text-center py-8 text-muted-foreground">
              Please select a campaign to view search terms
            </div>
          )}

          {/* Summary Cards */}
          {filteredSearchTerms && filteredSearchTerms.length > 0 && (
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Search Terms
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {filteredSearchTerms.length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Avg CTR</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(
                      filteredSearchTerms.reduce(
                        (sum: number, t: SearchTerm) => sum + t.ctr,
                        0
                      ) / filteredSearchTerms.length
                    ).toFixed(2)}
                    %
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Avg CPC</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    $
                    {(
                      filteredSearchTerms.reduce(
                        (sum: number, t: SearchTerm) => sum + t.cpc,
                        0
                      ) / filteredSearchTerms.length
                    ).toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Avg ACOS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(
                      filteredSearchTerms.reduce(
                        (sum: number, t: SearchTerm) => sum + t.acos,
                        0
                      ) / filteredSearchTerms.length
                    ).toFixed(1)}
                    %
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search Terms Table */}
          {filteredSearchTerms && filteredSearchTerms.length > 0 && (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Search Term</TableHead>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Match Type</TableHead>
                    <TableHead className="text-right">Impressions</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead className="text-right">CPC</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">ACOS</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSearchTerms.map(
                    (term: SearchTerm, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {term.searchTerm}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {term.keyword}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{term.matchType}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {term.impressions.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {term.clicks.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              term.ctr > 1
                                ? "text-green-600"
                                : term.ctr < 0.3
                                ? "text-red-600"
                                : ""
                            }
                          >
                            {term.ctr.toFixed(2)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          ${term.cpc.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {term.orders > 0 ? (
                            <span className="text-green-600 font-medium">
                              {term.orders}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={
                              term.acos < 30
                                ? "default"
                                : term.acos < 50
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {term.acos.toFixed(0)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleAddKeyword(term.searchTerm)}
                              disabled={
                                !selectedAdGroup ||
                                addKeywordMutation.isPending ||
                                term.addedAsKeyword
                              }
                              title="Add as keyword"
                            >
                              <Plus className="h-3 w-3 text-green-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleAddNegative(term.searchTerm)}
                              disabled={
                                !selectedAdGroup ||
                                addNegativeMutation.isPending ||
                                term.addedAsNegative
                              }
                              title="Add as negative"
                            >
                              <MinusCircle className="h-3 w-3 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* No Results */}
          {filteredSearchTerms && filteredSearchTerms.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No search terms found for this campaign
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
