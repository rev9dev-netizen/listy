"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Ban,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle,
  Lightbulb,
} from "lucide-react";

interface NegativeKeywordsManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId?: string;
}

interface NegativeKeyword {
  id: string;
  keyword: string;
  matchType: string;
  adGroup: {
    id: string;
    name: string;
    campaign: {
      id: string;
      campaignName: string;
    };
  };
  createdAt: string;
}

interface Suggestion {
  keyword: string;
  reason: string;
  confidence: string;
}

export default function NegativeKeywordsManager({
  open,
  onOpenChange,
  campaignId,
}: NegativeKeywordsManagerProps) {
  const queryClient = useQueryClient();
  const [newKeyword, setNewKeyword] = useState("");
  const [selectedAdGroup, setSelectedAdGroup] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch campaigns for ad group selection
  useQuery({
    queryKey: ["ppc-campaigns"],
    queryFn: async () => {
      const response = await fetch("/api/ppc/campaigns");
      if (!response.ok) throw new Error("Failed to fetch campaigns");
      return response.json();
    },
    enabled: open,
  });

  // Fetch ad groups
  const { data: adGroupsData } = useQuery({
    queryKey: ["ppc-ad-groups", campaignId],
    queryFn: async () => {
      const url = campaignId
        ? `/api/ppc/ad-groups?campaignId=${campaignId}`
        : "/api/ppc/ad-groups";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch ad groups");
      return response.json();
    },
    enabled: open,
  });

  // Fetch negative keywords
  const { data: negativeKeywordsData } = useQuery({
    queryKey: ["negative-keywords", campaignId],
    queryFn: async () => {
      const url = campaignId
        ? `/api/ppc/negative-keywords?campaignId=${campaignId}`
        : "/api/ppc/negative-keywords";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch negative keywords");
      return response.json();
    },
    enabled: open,
  });

  // Fetch AI suggestions
  const { data: suggestionsData, refetch: refetchSuggestions } = useQuery({
    queryKey: ["negative-keyword-suggestions", campaignId],
    queryFn: async () => {
      if (!campaignId) throw new Error("Campaign ID required");
      const response = await fetch("/api/ppc/negative-keywords/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId }),
      });
      if (!response.ok) throw new Error("Failed to fetch suggestions");
      return response.json();
    },
    enabled: false, // Manual trigger
  });

  // Add negative keyword mutation
  const addMutation = useMutation({
    mutationFn: async ({
      keyword,
      adGroupId,
    }: {
      keyword: string;
      adGroupId: string;
    }) => {
      const response = await fetch("/api/ppc/negative-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, adGroupId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add negative keyword");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["negative-keywords"] });
      toast.success("Negative keyword added");
      setNewKeyword("");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete negative keyword mutation
  const deleteMutation = useMutation({
    mutationFn: async (keywordId: string) => {
      const response = await fetch(
        `/api/ppc/negative-keywords?id=${keywordId}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) throw new Error("Failed to delete negative keyword");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["negative-keywords"] });
      toast.success("Negative keyword removed");
    },
    onError: () => {
      toast.error("Failed to remove negative keyword");
    },
  });

  const handleAdd = () => {
    if (!newKeyword.trim() || !selectedAdGroup) {
      toast.error("Please enter a keyword and select an ad group");
      return;
    }

    addMutation.mutate({
      keyword: newKeyword.trim(),
      adGroupId: selectedAdGroup,
    });
  };

  const handleAddSuggestion = (keyword: string) => {
    if (!selectedAdGroup) {
      toast.error("Please select an ad group first");
      return;
    }

    addMutation.mutate({
      keyword,
      adGroupId: selectedAdGroup,
    });
  };

  const handleGetSuggestions = () => {
    if (!campaignId) {
      toast.error("Please select a campaign first");
      return;
    }
    refetchSuggestions();
    setShowSuggestions(true);
  };

  const negativeKeywords: NegativeKeyword[] =
    negativeKeywordsData?.negativeKeywords || [];
  const adGroups = adGroupsData?.adGroups || [];
  const suggestions: Suggestion[] = suggestionsData?.suggestions || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-red-500" />
            Negative Keywords Manager
          </DialogTitle>
          <DialogDescription>
            Add negative keywords to prevent ads from showing for irrelevant
            searches
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add Negative Keyword Form */}
          <div className="space-y-4">
            <h3 className="font-semibold">Add Negative Keyword</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adGroup">Ad Group</Label>
                <Select
                  value={selectedAdGroup}
                  onValueChange={setSelectedAdGroup}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select ad group" />
                  </SelectTrigger>
                  <SelectContent>
                    {adGroups.map((ag: { id: string; name: string }) => (
                      <SelectItem key={ag.id} value={ag.id}>
                        {ag.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="keyword">Keyword</Label>
                <div className="flex gap-2">
                  <Input
                    id="keyword"
                    placeholder="e.g., cheap, free, how to"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  />
                  <Button
                    onClick={handleAdd}
                    disabled={addMutation.isPending}
                    size="icon"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* AI Suggestions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                AI-Powered Suggestions
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGetSuggestions}
                disabled={!campaignId}
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                Get Suggestions
              </Button>
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="border rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">
                          {suggestion.keyword}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {suggestion.confidence}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {suggestion.reason}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAddSuggestion(suggestion.keyword)}
                      disabled={!selectedAdGroup || addMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current Negative Keywords */}
          <div className="space-y-4">
            <h3 className="font-semibold">
              Current Negative Keywords ({negativeKeywords.length})
            </h3>

            {negativeKeywords.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Ban className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No negative keywords added yet
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Keyword</TableHead>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Ad Group</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {negativeKeywords.map((nk) => (
                      <TableRow key={nk.id}>
                        <TableCell className="font-mono font-medium">
                          {nk.keyword}
                        </TableCell>
                        <TableCell>
                          {nk.adGroup.campaign.campaignName}
                        </TableCell>
                        <TableCell>{nk.adGroup.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(nk.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteMutation.mutate(nk.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
