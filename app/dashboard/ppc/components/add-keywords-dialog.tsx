/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";

interface AddKeywordsDialogProps {
  adGroupId: string;
  children: React.ReactNode;
}

interface KeywordInput {
  id: string;
  keyword: string;
  matchType: string;
  bid: string;
}

export default function AddKeywordsDialog({
  adGroupId,
  children,
}: AddKeywordsDialogProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [keywords, setKeywords] = useState<KeywordInput[]>([
    { id: "1", keyword: "", matchType: "BROAD", bid: "" },
  ]);
  const [bulkText, setBulkText] = useState("");
  const [defaultBid, setDefaultBid] = useState("0.75");
  const [defaultMatchType, setDefaultMatchType] = useState("BROAD");

  const router = useRouter();
  const queryClient = useQueryClient();

  const addKeywordsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/ppc/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add keywords");
      }
      return response.json();
    },
    onSuccess: (data) => {
      const message =
        data.created > 0
          ? `Successfully added ${data.created} keyword(s)${
              data.failed > 0 ? `, ${data.failed} failed` : ""
            }`
          : "No keywords were added";
      toast.success(message);

      if (data.errors && data.errors.length > 0) {
        data.errors.forEach((err: any) => {
          toast.error(`${err.keyword}: ${err.error}`);
        });
      }

      setOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["keywords", adGroupId] });
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add keywords");
    },
  });

  const resetForm = () => {
    setKeywords([{ id: "1", keyword: "", matchType: "BROAD", bid: "" }]);
    setBulkText("");
    setDefaultBid("0.75");
    setDefaultMatchType("BROAD");
    setMode("single");
  };

  const addKeywordRow = () => {
    setKeywords([
      ...keywords,
      {
        id: Date.now().toString(),
        keyword: "",
        matchType: "BROAD",
        bid: defaultBid,
      },
    ]);
  };

  const removeKeywordRow = (id: string) => {
    if (keywords.length > 1) {
      setKeywords(keywords.filter((kw) => kw.id !== id));
    }
  };

  const updateKeyword = (
    id: string,
    field: keyof KeywordInput,
    value: string
  ) => {
    setKeywords(
      keywords.map((kw) => (kw.id === id ? { ...kw, [field]: value } : kw))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let keywordsToAdd: any[] = [];

    if (mode === "single") {
      // Validate single keyword entries
      const validKeywords = keywords.filter(
        (kw) => kw.keyword.trim() && kw.bid
      );
      if (validKeywords.length === 0) {
        toast.error("Please add at least one keyword with a bid");
        return;
      }
      keywordsToAdd = validKeywords.map((kw) => ({
        keyword: kw.keyword.trim(),
        matchType: kw.matchType,
        bid: parseFloat(kw.bid),
        status: "ENABLED",
      }));
    } else {
      // Parse bulk text input
      const lines = bulkText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (lines.length === 0) {
        toast.error("Please enter at least one keyword");
        return;
      }

      const bidValue = parseFloat(defaultBid);
      if (isNaN(bidValue) || bidValue <= 0) {
        toast.error("Please enter a valid default bid");
        return;
      }

      keywordsToAdd = lines.map((line) => ({
        keyword: line,
        matchType: defaultMatchType,
        bid: bidValue,
        status: "ENABLED",
      }));
    }

    addKeywordsMutation.mutate({
      adGroupId,
      keywords: keywordsToAdd,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Keywords</DialogTitle>
          <DialogDescription>
            Add keywords to this ad group. You can add them one by one or in
            bulk.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Mode Toggle */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === "single" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("single")}
              >
                Single Entry
              </Button>
              <Button
                type="button"
                variant={mode === "bulk" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("bulk")}
              >
                Bulk Entry
              </Button>
            </div>

            {mode === "single" ? (
              <div className="space-y-3">
                {keywords.map((kw, index) => (
                  <div
                    key={kw.id}
                    className="grid grid-cols-[1fr,120px,100px,40px] gap-2 items-end"
                  >
                    <div className="grid gap-1">
                      {index === 0 && (
                        <Label htmlFor={`keyword-${kw.id}`}>Keyword</Label>
                      )}
                      <Input
                        id={`keyword-${kw.id}`}
                        placeholder="e.g., wireless headphones"
                        value={kw.keyword}
                        onChange={(e) =>
                          updateKeyword(kw.id, "keyword", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-1">
                      {index === 0 && <Label>Match Type</Label>}
                      <Select
                        value={kw.matchType}
                        onValueChange={(value) =>
                          updateKeyword(kw.id, "matchType", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BROAD">Broad</SelectItem>
                          <SelectItem value="PHRASE">Phrase</SelectItem>
                          <SelectItem value="EXACT">Exact</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1">
                      {index === 0 && <Label>Bid ($)</Label>}
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.75"
                        value={kw.bid}
                        onChange={(e) =>
                          updateKeyword(kw.id, "bid", e.target.value)
                        }
                        required
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeKeywordRow(kw.id)}
                      disabled={keywords.length === 1}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addKeywordRow}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Keyword
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="defaultMatchType">Default Match Type</Label>
                    <Select
                      value={defaultMatchType}
                      onValueChange={setDefaultMatchType}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BROAD">Broad</SelectItem>
                        <SelectItem value="PHRASE">Phrase</SelectItem>
                        <SelectItem value="EXACT">Exact</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="defaultBid">Default Bid ($)</Label>
                    <Input
                      id="defaultBid"
                      type="number"
                      step="0.01"
                      value={defaultBid}
                      onChange={(e) => setDefaultBid(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bulkText">Keywords (one per line)</Label>
                  <Textarea
                    id="bulkText"
                    placeholder="wireless headphones&#10;bluetooth earbuds&#10;noise cancelling headset&#10;..."
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    rows={10}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter one keyword per line. All keywords will use the same
                    match type and bid.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={addKeywordsMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addKeywordsMutation.isPending}>
              {addKeywordsMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Keywords
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
