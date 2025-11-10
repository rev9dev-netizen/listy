"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  SparklesIcon,
  CheckCircle2Icon,
  UploadIcon,
  PlusIcon,
  ChevronDownIcon,
  RefreshCwIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  DownloadIcon,
  ArrowUpDownIcon,
  PencilIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Keyword {
  phrase: string;
  searchVolume: number;
  sales: number;
  cps: number | null;
  selected: boolean;
}

interface AISuggestion {
  content: string;
  section: "title" | "bullet" | "description";
  bulletIndex?: number;
}

export default function ListingBuilderPage() {
  // Keywords state
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [manualKeyword, setManualKeyword] = useState("");
  const [sortBy, setSortBy] = useState<"volume" | "sales" | "alpha">("volume");
  const [showUpload, setShowUpload] = useState(true);
  const [keywordBankOpen, setKeywordBankOpen] = useState(true);
  const [rootKeywordsOpen, setRootKeywordsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [manualKeywordDialog, setManualKeywordDialog] = useState(false);
  const [wordFilter, setWordFilter] = useState<"all" | "1" | "2" | "3+">("1");
  const keywordsPerPage = 20;

  // AI Parameters state (collapsible)
  const [parametersOpen, setParametersOpen] = useState(false);
  const [productCharacteristics, setProductCharacteristics] = useState("");
  const [brandName, setBrandName] = useState("");
  const [showBrandName, setShowBrandName] = useState("beginning");
  const [productName, setProductName] = useState("");
  const [tone, setTone] = useState("formal");
  const [targetAudience, setTargetAudience] = useState("");
  const [avoidWords, setAvoidWords] = useState("");

  // Listing state
  const [title, setTitle] = useState("");
  const [bullet1, setBullet1] = useState("");
  const [bullet2, setBullet2] = useState("");
  const [bullet3, setBullet3] = useState("");
  const [bullet4, setBullet4] = useState("");
  const [bullet5, setBullet5] = useState("");
  const [description, setDescription] = useState("");

  // AI Suggestion Dialog state
  const [suggestionDialog, setSuggestionDialog] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] =
    useState<AISuggestion | null>(null);

  // Score state
  const [generatedVolume, setGeneratedVolume] = useState(0);
  const [listingScore, setListingScore] = useState("Not Generated");

  const titleLimit = 200;
  const bulletLimit = 200;
  const descLimit = 2000;

  // Parse CSV file
  const parseCerebroCSV = (csvText: string): Keyword[] => {
    const lines = csvText.split("\n");
    const keywords: Keyword[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parse CSV line (handle quoted fields)
      const matches = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
      if (!matches || matches.length < 7) continue;

      const phrase = matches[0].replace(/^"|"$/g, "");
      const sales = parseFloat(matches[3]) || 0;
      const searchVolume = parseFloat(matches[5]) || 0;
      const cpsMatch = matches[12];
      const cps = cpsMatch && cpsMatch !== '"-"' ? parseFloat(cpsMatch) : null;

      if (phrase) {
        keywords.push({
          phrase,
          searchVolume,
          sales,
          cps,
          selected: false,
        });
      }
    }

    return keywords;
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsedKeywords = parseCerebroCSV(text);

      // Simulate processing time for better UX
      setTimeout(() => {
        setKeywords(parsedKeywords);
        setShowUpload(false);
        setIsUploading(false);
        setCurrentPage(1); // Reset to first page
        toast.success(
          `Loaded ${parsedKeywords.length} keywords from Cerebro file`
        );
      }, 500);

      // Reset the file input
      event.target.value = "";
    };
    reader.readAsText(file);
  };

  // Export keywords as CSV
  const handleExportKeywords = () => {
    if (keywords.length === 0) {
      toast.error("No keywords to export");
      return;
    }

    const csvContent = [
      "Keyword,Search Volume,Sales,CPS,Selected",
      ...keywords.map(
        (k) =>
          `"${k.phrase}",${k.searchVolume},${k.sales},${k.cps ?? "N/A"},${
            k.selected ? "Yes" : "No"
          }`
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `keyword-bank-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Keywords exported successfully!");
  };

  // Add manual keyword
  const handleAddKeyword = () => {
    if (!manualKeyword.trim()) return;

    const newKeyword: Keyword = {
      phrase: manualKeyword.trim(),
      searchVolume: 0,
      sales: 0,
      cps: null,
      selected: true,
    };

    setKeywords([...keywords, newKeyword]);
    setManualKeyword("");
    toast.success("Keyword added!");
  };

  // Toggle keyword selection
  const toggleKeyword = (phrase: string) => {
    setKeywords(
      keywords.map((k) =>
        k.phrase === phrase ? { ...k, selected: !k.selected } : k
      )
    );
  };

  // Generate content mutation
  const generateContentMutation = useMutation({
    mutationFn: async (data: {
      section: "title" | "bullets" | "description";
      bulletIndex?: number;
    }) => {
      const selectedKeywords = keywords
        .filter((k) => k.selected)
        .map((k) => k.phrase);

      if (selectedKeywords.length === 0) {
        throw new Error("Please select keywords first");
      }

      if (!productCharacteristics.trim()) {
        throw new Error("Please fill in product characteristics");
      }

      const response = await fetch("/api/listing/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketplace: "US",
          brand: brandName,
          product_type: productName,
          attributes: { characteristics: productCharacteristics },
          tone: tone,
          keywords: {
            primary: selectedKeywords,
            secondary: [],
          },
          section: data.section,
          showBrandName,
          targetAudience,
          avoidWords: avoidWords
            .split(",")
            .map((w) => w.trim())
            .filter(Boolean),
        }),
      });

      if (!response.ok) throw new Error("Failed to generate content");
      return { ...(await response.json()), ...data };
    },
    onSuccess: (data) => {
      // Show suggestion dialog instead of directly applying
      if (data.section === "title") {
        setCurrentSuggestion({
          content: data.title,
          section: "title",
        });
      } else if (data.section === "bullets") {
        setCurrentSuggestion({
          content: data.bullets.join("\n\n"),
          section: "bullet",
        });
      } else if (data.section === "description") {
        setCurrentSuggestion({
          content: data.description,
          section: "description",
        });
      }
      setSuggestionDialog(true);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Apply suggestion
  const applySuggestion = () => {
    if (!currentSuggestion) return;

    if (currentSuggestion.section === "title") {
      setTitle(currentSuggestion.content);
    } else if (currentSuggestion.section === "bullet") {
      const bullets = currentSuggestion.content.split("\n\n");
      setBullet1(bullets[0] || "");
      setBullet2(bullets[1] || "");
      setBullet3(bullets[2] || "");
      setBullet4(bullets[3] || "");
      setBullet5(bullets[4] || "");
    } else if (currentSuggestion.section === "description") {
      setDescription(currentSuggestion.content);
    }

    setSuggestionDialog(false);
    setCurrentSuggestion(null);
    updateScore();
    toast.success("Suggestion applied!");
  };

  // Regenerate suggestion
  const regenerateSuggestion = () => {
    if (!currentSuggestion) return;
    setSuggestionDialog(false);

    setTimeout(() => {
      generateContentMutation.mutate({
        section:
          currentSuggestion.section === "bullet"
            ? "bullets"
            : currentSuggestion.section,
      });
    }, 100);
  };

  // Calculate listing score
  const updateScore = () => {
    const selectedKeywords = keywords.filter((k) => k.selected);
    const usedKeywords = selectedKeywords.filter((k) => {
      const allText =
        `${title} ${bullet1} ${bullet2} ${bullet3} ${bullet4} ${bullet5} ${description}`.toLowerCase();
      return allText.includes(k.phrase.toLowerCase());
    });

    const volume = usedKeywords.reduce((sum, k) => sum + k.searchVolume, 0);
    setGeneratedVolume(volume);

    if (
      title &&
      (bullet1 || bullet2 || bullet3 || bullet4 || bullet5) &&
      description
    ) {
      setListingScore("Good Listing");
    } else {
      setListingScore("Not Generated");
    }
  };

  const getCharCountColor = (current: number, limit: number) => {
    const percentage = (current / limit) * 100;
    if (percentage > 100) return "text-red-500";
    if (percentage > 90) return "text-yellow-500";
    return "text-muted-foreground";
  };

  // Filter keywords by word count
  const getWordCount = (phrase: string) => {
    return phrase.trim().split(/\s+/).length;
  };

  const filteredKeywords = keywords.filter((kw) => {
    if (wordFilter === "all") return true;
    const wordCount = getWordCount(kw.phrase);
    if (wordFilter === "1") return wordCount === 1;
    if (wordFilter === "2") return wordCount === 2;
    if (wordFilter === "3+") return wordCount >= 3;
    return true;
  });

  const sortedKeywords = [...filteredKeywords].sort((a, b) => {
    if (sortBy === "volume") return b.searchVolume - a.searchVolume;
    if (sortBy === "sales") return b.sales - a.sales;
    return a.phrase.localeCompare(b.phrase);
  });

  // Pagination calculations
  const totalPages = Math.ceil(sortedKeywords.length / keywordsPerPage);
  const startIndex = (currentPage - 1) * keywordsPerPage;
  const endIndex = startIndex + keywordsPerPage;
  const paginatedKeywords = sortedKeywords.slice(startIndex, endIndex);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      // Show pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const selectedCount = keywords.filter((k) => k.selected).length;
  const canGenerate =
    selectedCount > 0 && productCharacteristics.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Listing Builder</h1>
          <p className="text-muted-foreground">
            Upload Cerebro keywords and build optimized Amazon listings with AI
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <CheckCircle2Icon className="mr-2 h-4 w-4" />
            Saved
          </Button>
          <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
            Sync to Amazon
          </Button>
        </div>
      </div>

      {/* Main Layout: Keyword Bank (Left) + Content Editor (Right) */}
      <div className="grid gap-3 lg:grid-cols-[400px_1fr] h-[calc(100vh-200px)]">
        {/* Left: Keyword Bank - Fixed height with scroll */}
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            <Collapsible
              open={keywordBankOpen}
              onOpenChange={setKeywordBankOpen}
            >
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">
                          Keyword Bank
                        </CardTitle>
                      </div>
                      <ChevronDownIcon
                        className={`h-5 w-5 transition-transform ${
                          keywordBankOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                    <CardDescription className="text-left">
                      {keywords.length === 0
                        ? keywordBankOpen
                          ? "Upload Cerebro CSV to get started"
                          : "Click to expand and add keywords"
                        : `${keywords.length} keywords loaded`}
                    </CardDescription>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    {/* Upload Cerebro File - Show conditionally */}
                    {isUploading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-32" />
                        <div className="flex gap-2">
                          <Skeleton className="h-10 flex-1" />
                          <Skeleton className="h-10 w-10" />
                        </div>
                        <div className="space-y-2 pt-2">
                          <Skeleton className="h-3 w-48" />
                          <Skeleton className="h-3 w-36" />
                        </div>
                      </div>
                    ) : keywords.length === 0 ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            id="cerebro-upload"
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="flex-1"
                          />
                          <Button variant="outline" size="icon">
                            <UploadIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      !showUpload && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            const input = document.getElementById(
                              "cerebro-upload-hidden"
                            ) as HTMLInputElement;
                            input?.click();
                          }}
                        >
                          <UploadIcon className="mr-2 h-4 w-4" />
                          Upload New File
                        </Button>
                      )
                    )}

                    {/* Hidden file input for re-upload */}
                    {keywords.length > 0 && (
                      <Input
                        id="cerebro-upload-hidden"
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    )}

                    {/* Action Buttons with Collapsible Add Keywords */}
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            setManualKeywordDialog(!manualKeywordDialog)
                          }
                          title="Add keywords manually"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={handleExportKeywords}
                          disabled={keywords.length === 0}
                          variant="outline"
                          className="flex-1"
                        >
                          <DownloadIcon className="mr-2 h-4 w-4" />
                          Export
                        </Button>
                      </div>

                      {/* Collapsible Add Keywords Section */}
                      {manualKeywordDialog && (
                        <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                          <Label
                            htmlFor="manual-keyword-input"
                            className="text-sm font-medium"
                          >
                            Add Keywords Manually
                          </Label>
                          <Textarea
                            id="manual-keyword-input"
                            placeholder="Enter keyword or phrase (press Enter to add)"
                            value={manualKeyword}
                            onChange={(e) => setManualKeyword(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleAddKeyword();
                              }
                            }}
                            rows={3}
                            className="resize-none"
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={handleAddKeyword}
                              disabled={!manualKeyword.trim()}
                              size="sm"
                              className="flex-1"
                            >
                              <PlusIcon className="mr-2 h-4 w-4" />
                              Add Keyword
                            </Button>
                            <Button
                              onClick={() => {
                                setManualKeywordDialog(false);
                                setManualKeyword("");
                              }}
                              variant="outline"
                              size="sm"
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Press Enter to add, Shift+Enter for new line
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Keywords List */}
                    {isUploading ? (
                      <div className="space-y-3 pt-4">
                        <Skeleton className="h-4 w-40" />
                        <div className="border rounded-lg p-4 space-y-3">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <Skeleton className="h-4 w-4" />
                              <Skeleton className="h-4 flex-1" />
                              <Skeleton className="h-4 w-12" />
                              <Skeleton className="h-4 w-12" />
                              <Skeleton className="h-4 w-10" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : keywords.length > 0 ? (
                      <>
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {selectedCount} of {keywords.length} selected
                            </span>
                          </div>

                          {/* Insert Keywords Buttons */}
                          {selectedCount > 0 && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  generateContentMutation.mutate({
                                    section: "title",
                                  })
                                }
                                disabled={
                                  generateContentMutation.isPending ||
                                  !productCharacteristics.trim()
                                }
                                className="flex-1 text-xs"
                              >
                                + Product Title
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  generateContentMutation.mutate({
                                    section: "bullets",
                                  })
                                }
                                disabled={
                                  generateContentMutation.isPending ||
                                  !productCharacteristics.trim()
                                }
                                className="flex-1 text-xs"
                              >
                                + Bullet Points
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  generateContentMutation.mutate({
                                    section: "description",
                                  })
                                }
                                disabled={
                                  generateContentMutation.isPending ||
                                  !productCharacteristics.trim()
                                }
                                className="flex-1 text-xs"
                              >
                                + Description
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Keywords Table with sortable headers */}
                        <TooltipProvider>
                          <div className="border rounded-lg">
                            <div className="grid grid-cols-[auto_1fr_40px_55px_50px_45px] gap-2 p-2 border-b bg-muted/50 text-xs font-medium">
                              <div></div>
                              <div>Keyword</div>
                              <div className="text-right">Used</div>
                              <button
                                onClick={() => {
                                  setSortBy(
                                    sortBy === "volume" ? "alpha" : "volume"
                                  );
                                  setCurrentPage(1);
                                }}
                                className="flex items-center justify-end gap-1 hover:text-foreground transition-colors"
                              >
                                SV
                                <ArrowUpDownIcon className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => {
                                  setSortBy(
                                    sortBy === "sales" ? "alpha" : "sales"
                                  );
                                  setCurrentPage(1);
                                }}
                                className="flex items-center justify-end gap-1 hover:text-foreground transition-colors"
                              >
                                Sales
                                <ArrowUpDownIcon className="h-3 w-3" />
                              </button>
                              <div className="text-right">CPS</div>
                            </div>
                            <div>
                              {paginatedKeywords.map((kw, index) => {
                                const allText =
                                  `${title} ${bullet1} ${bullet2} ${bullet3} ${bullet4} ${bullet5} ${description}`.toLowerCase();

                                // Exact word matching using word boundaries
                                const escapedPhrase = kw.phrase
                                  .toLowerCase()
                                  .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                                const regex = new RegExp(
                                  `\\b${escapedPhrase}\\b`,
                                  "g"
                                );
                                const matches = allText.match(regex);
                                const keywordCount = matches
                                  ? matches.length
                                  : 0;
                                const isUsed = keywordCount > 0;

                                return (
                                  <div
                                    key={index}
                                    className={`grid grid-cols-[auto_1fr_40px_55px_50px_45px] gap-2 p-2 border-b text-xs hover:bg-muted/50 ${
                                      isUsed
                                        ? "bg-green-50 dark:bg-green-950/30"
                                        : ""
                                    }`}
                                  >
                                    <Checkbox
                                      checked={kw.selected}
                                      onCheckedChange={() =>
                                        toggleKeyword(kw.phrase)
                                      }
                                    />
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="flex items-center gap-1 overflow-hidden">
                                          <span className="truncate">
                                            {kw.phrase}
                                          </span>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent
                                        side="top"
                                        className="max-w-xs"
                                      >
                                        <p>{kw.phrase}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                    <div className="text-right text-muted-foreground">
                                      {keywordCount > 0 ? keywordCount : ""}
                                    </div>
                                    <div className="text-right text-muted-foreground">
                                      {kw.searchVolume > 0
                                        ? kw.searchVolume >= 1000
                                          ? `${(kw.searchVolume / 1000).toFixed(
                                              1
                                            )}k`
                                          : kw.searchVolume
                                        : "-"}
                                    </div>
                                    <div className="text-right text-muted-foreground">
                                      {kw.sales > 0 ? kw.sales : "-"}
                                    </div>
                                    <div className="text-right text-muted-foreground">
                                      {kw.cps !== null ? kw.cps : "N/A"}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Pagination Controls */}
                          {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-1 p-4 border-t">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setCurrentPage(Math.max(1, currentPage - 1))
                                }
                                disabled={currentPage === 1}
                                className="h-8 w-8 p-0"
                              >
                                ←
                              </Button>

                              {getPageNumbers().map((page, idx) => (
                                <Button
                                  key={idx}
                                  variant={
                                    page === currentPage ? "default" : "outline"
                                  }
                                  size="sm"
                                  onClick={() => {
                                    if (typeof page === "number") {
                                      setCurrentPage(page);
                                    }
                                  }}
                                  disabled={typeof page === "string"}
                                  className="h-8 w-8 p-0"
                                >
                                  {page}
                                </Button>
                              ))}

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setCurrentPage(
                                    Math.min(totalPages, currentPage + 1)
                                  )
                                }
                                disabled={currentPage === totalPages}
                                className="h-8 w-8 p-0"
                              >
                                →
                              </Button>
                            </div>
                          )}
                        </TooltipProvider>
                      </>
                    ) : null}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Root Keywords Section - Below Main Table */}
            {keywords.length > 0 && (
              <Collapsible
                open={rootKeywordsOpen}
                onOpenChange={setRootKeywordsOpen}
              >
                <Card>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1 text-left">
                          <CardTitle className="text-base">
                            Root Keywords ({filteredKeywords.length})
                          </CardTitle>
                          <CardDescription>
                            {rootKeywordsOpen
                              ? "Sorted by phrase frequency"
                              : `${
                                  wordFilter === "1"
                                    ? "1 word phrases"
                                    : wordFilter === "2"
                                    ? "2 word phrases"
                                    : "3+ word phrases"
                                } - Click to expand`}
                          </CardDescription>
                        </div>
                        <ChevronDownIcon
                          className={`h-5 w-5 transition-transform ${
                            rootKeywordsOpen ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      <div className="text-xs text-muted-foreground">
                        Alone, base keywords are not that useful for your KFS,
                        but understanding which keyword phrases work best to
                        include the most base keywords
                      </div>

                      {/* Filter Buttons */}
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant={wordFilter === "1" ? "default" : "outline"}
                          onClick={() => {
                            setWordFilter("1");
                            setCurrentPage(1);
                          }}
                          className="text-xs"
                        >
                          1 Word Roots
                        </Button>
                        <Button
                          size="sm"
                          variant={wordFilter === "2" ? "default" : "outline"}
                          onClick={() => {
                            setWordFilter("2");
                            setCurrentPage(1);
                          }}
                          className="text-xs"
                        >
                          2 Word Roots
                        </Button>
                        <Button
                          size="sm"
                          variant={wordFilter === "3+" ? "default" : "outline"}
                          onClick={() => {
                            setWordFilter("3+");
                            setCurrentPage(1);
                          }}
                          className="text-xs"
                        >
                          3+ Word Roots
                        </Button>
                      </div>

                      {/* Root Keywords as Clickable Tags */}
                      <div className="flex flex-wrap gap-2">
                        {sortedKeywords.map((kw, index) => {
                          const allText =
                            `${title} ${bullet1} ${bullet2} ${bullet3} ${bullet4} ${bullet5} ${description}`.toLowerCase();
                          const escapedPhrase = kw.phrase
                            .toLowerCase()
                            .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                          const regex = new RegExp(
                            `\\b${escapedPhrase}\\b`,
                            "g"
                          );
                          const matches = allText.match(regex);
                          const keywordCount = matches ? matches.length : 0;

                          return (
                            <button
                              key={index}
                              onClick={() => toggleKeyword(kw.phrase)}
                              className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                                kw.selected
                                  ? "bg-blue-500 text-white border-blue-600"
                                  : "bg-background hover:bg-muted border-border"
                              } ${
                                keywordCount > 0
                                  ? "ring-2 ring-green-500/50"
                                  : ""
                              }`}
                            >
                              <span
                                className={`font-medium ${
                                  keywordCount > 0 ? "line-through" : ""
                                }`}
                              >
                                {kw.phrase}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )}

            {/* Score Cards Below Keyword Bank */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Generated Search Volume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {generatedVolume >= 1000000
                    ? `${(generatedVolume / 1000000).toFixed(1)}M`
                    : generatedVolume >= 1000
                    ? `${(generatedVolume / 1000).toFixed(1)}K`
                    : generatedVolume}
                </div>
                <p className="text-sm text-muted-foreground">
                  Total from used keywords
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Listing Optimization Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 rounded-full bg-green-200">
                      <div
                        className="h-2 rounded-full bg-green-500"
                        style={{
                          width: `${
                            title && description
                              ? 80
                              : title || description
                              ? 40
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <p className="font-semibold text-green-600">{listingScore}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right: Content Editor - Fixed height with scroll */}
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {/* AI Parameters - Collapsible */}
            <Collapsible open={parametersOpen} onOpenChange={setParametersOpen}>
              <Card className="border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950/30">
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <SparklesIcon className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                        <CardTitle className="text-base">
                          AI Parameters
                        </CardTitle>
                      </div>
                      <ChevronDownIcon
                        className={`h-5 w-5 transition-transform ${
                          parametersOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                    <CardDescription className="text-left">
                      {parametersOpen
                        ? "Fill these details to give AI context for better content generation"
                        : "Click to expand and configure AI parameters"}
                    </CardDescription>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4 pt-0">
                    <div className="space-y-2">
                      <Label className="font-medium">
                        Product Characteristics *{" "}
                        <span className="text-red-600 font-semibold dark:text-red-400">
                          Required
                        </span>
                      </Label>
                      <Textarea
                        placeholder="e.g., Blue, 5G, Durable and sleek design, night mode, etc"
                        value={productCharacteristics}
                        onChange={(e) =>
                          setProductCharacteristics(e.target.value)
                        }
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">
                        {productCharacteristics.length}/1500 characters
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="font-medium">Brand Name</Label>
                        <Input
                          placeholder="Optional"
                          value={brandName}
                          onChange={(e) => setBrandName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium">Show Brand Name</Label>
                        <Select
                          value={showBrandName}
                          onValueChange={setShowBrandName}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginning">
                              At beginning of title
                            </SelectItem>
                            <SelectItem value="end">At end of title</SelectItem>
                            <SelectItem value="none">
                              Don&apos;t show
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="font-medium">Product Name</Label>
                        <Input
                          placeholder="e.g., Knee Straps"
                          value={productName}
                          onChange={(e) => setProductName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium">Tone</Label>
                        <Select value={tone} onValueChange={setTone}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="formal">Formal</SelectItem>
                            <SelectItem value="casual">Casual</SelectItem>
                            <SelectItem value="professional">
                              Professional
                            </SelectItem>
                            <SelectItem value="luxury">Luxury</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-medium">Target Audience</Label>
                      <Textarea
                        placeholder="Enter attributes separated by commas"
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        rows={2}
                      />
                      <p className="text-xs text-muted-foreground">
                        {targetAudience.length}/100
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-medium">
                        Words & Special Characters to Avoid
                      </Label>
                      <Textarea
                        placeholder="Enter words & characters separated by commas"
                        value={avoidWords}
                        onChange={(e) => setAvoidWords(e.target.value)}
                        rows={2}
                      />
                      <p className="text-xs text-muted-foreground">
                        {avoidWords.length}/100
                      </p>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Product Title */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Product Title</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() =>
                      generateContentMutation.mutate({ section: "title" })
                    }
                    disabled={generateContentMutation.isPending || !canGenerate}
                  >
                    <SparklesIcon className="h-4 w-4" />
                    {generateContentMutation.isPending
                      ? "Generating..."
                      : "Write with AI"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Textarea
                  placeholder="Start typing content here"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    updateScore();
                  }}
                  rows={3}
                />
                <div className="flex items-center justify-between text-xs">
                  <span className={getCharCountColor(title.length, titleLimit)}>
                    {title.length}/{titleLimit} characters
                  </span>
                  <span className="text-muted-foreground">
                    Keywords used:{" "}
                    {
                      keywords.filter(
                        (k) =>
                          k.selected &&
                          title.toLowerCase().includes(k.phrase.toLowerCase())
                      ).length
                    }
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Features (Bullet Points) */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Features (Bullet Points)
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() =>
                      generateContentMutation.mutate({ section: "bullets" })
                    }
                    disabled={generateContentMutation.isPending || !canGenerate}
                  >
                    <SparklesIcon className="h-4 w-4" />
                    {generateContentMutation.isPending
                      ? "Generating..."
                      : "Write with AI"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { value: bullet1, setter: setBullet1, label: "Feature #1" },
                  { value: bullet2, setter: setBullet2, label: "Feature #2" },
                  { value: bullet3, setter: setBullet3, label: "Feature #3" },
                  { value: bullet4, setter: setBullet4, label: "Feature #4" },
                  { value: bullet5, setter: setBullet5, label: "Feature #5" },
                ].map((bullet, index) => (
                  <div key={index} className="space-y-2">
                    <Label>{bullet.label}</Label>
                    <Textarea
                      placeholder="Start typing content here"
                      value={bullet.value}
                      onChange={(e) => {
                        bullet.setter(e.target.value);
                        updateScore();
                      }}
                      rows={2}
                    />
                    <p
                      className={`text-xs ${getCharCountColor(
                        bullet.value.length,
                        bulletLimit
                      )}`}
                    >
                      {bullet.value.length}/{bulletLimit} characters
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Description</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() =>
                      generateContentMutation.mutate({ section: "description" })
                    }
                    disabled={generateContentMutation.isPending || !canGenerate}
                  >
                    <SparklesIcon className="h-4 w-4" />
                    {generateContentMutation.isPending
                      ? "Generating..."
                      : "Write with AI"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Textarea
                  placeholder="Start typing content here"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    updateScore();
                  }}
                  rows={8}
                />
                <p
                  className={`text-xs ${getCharCountColor(
                    description.length,
                    descLimit
                  )}`}
                >
                  {description.length}/{descLimit} characters
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* AI Suggestion Dialog */}
      <Dialog open={suggestionDialog} onOpenChange={setSuggestionDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SparklesIcon className="h-5 w-5 text-blue-600" />
              AI Suggestion
            </DialogTitle>
            <DialogDescription>
              Review the AI-generated content before applying it to your listing
            </DialogDescription>
          </DialogHeader>

          {currentSuggestion && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <Label className="mb-2 block text-sm font-medium">
                  {currentSuggestion.section === "title"
                    ? "Product Title"
                    : currentSuggestion.section === "bullet"
                    ? "Features (Bullet Points)"
                    : "Description"}
                </Label>
                <div className="whitespace-pre-wrap rounded bg-background p-3 text-sm">
                  {currentSuggestion.content}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border bg-blue-50 p-3">
                <div className="flex items-center gap-2">
                  <SparklesIcon className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Powered by AI</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={regenerateSuggestion}
                    disabled={generateContentMutation.isPending}
                  >
                    <RefreshCwIcon className="mr-2 h-4 w-4" />
                    {generateContentMutation.isPending
                      ? "Regenerating..."
                      : "Regenerate"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSuggestionDialog(false);
                setCurrentSuggestion(null);
              }}
            >
              <ThumbsDownIcon className="mr-2 h-4 w-4" />
              Discard
            </Button>
            <Button onClick={applySuggestion}>
              <ThumbsUpIcon className="mr-2 h-4 w-4" />
              Use Suggestion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
