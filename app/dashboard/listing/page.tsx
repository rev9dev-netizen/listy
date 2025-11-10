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
  const [keywordBankOpen, setKeywordBankOpen] = useState(true);
  const [rootKeywordsOpen, setRootKeywordsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [manualKeywordDialog, setManualKeywordDialog] = useState(false);
  const [addKeywordsDialog, setAddKeywordsDialog] = useState(false);
  const [bulkKeywordText, setBulkKeywordText] = useState("");
  const [rootWordFilter, setRootWordFilter] = useState<"1" | "2" | "3+">("1");
  const [isAiFiltering, setIsAiFiltering] = useState(false);
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
      // Listing is complete
    } else {
      // Listing is incomplete
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

  // Keyword Bank sorting (no filtering - shows all keywords)
  const sortedKeywords = [...keywords].sort((a, b) => {
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

      {/* Main Layout: Always Show Full Interface */}
      <div className="grid gap-3 lg:grid-cols-[480px_1fr] h-[calc(100vh-200px)]">
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
                      {`${keywords.length} keywords loaded`}
                    </CardDescription>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    {/* Empty State or Keyword Features */}
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
                      /* Empty State Within Card */
                      <div className="text-center py-12 space-y-6">
                        <div className="flex justify-center">
                          <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
                            <svg
                              className="w-10 h-10 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                              />
                            </svg>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-base mb-1.5">
                            You have no keywords yet
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Add keywords manually or use our guided builder to
                            find keywords
                          </p>
                        </div>

                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAddKeywordsDialog(true)}
                          >
                            Add Keywords
                          </Button>
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled
                          >
                            Find Keywords
                          </Button>
                        </div>

                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t"></div>
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                              Or
                            </span>
                          </div>
                        </div>

                        <div className="px-8">
                          <Label
                            htmlFor="keyword-bank-upload"
                            className="cursor-pointer"
                          >
                            <div className="border-2 border-dashed rounded-lg p-6 hover:border-blue-500 transition-colors">
                              <div className="space-y-2">
                                <UploadIcon className="mx-auto h-6 w-6 text-muted-foreground" />
                                <div className="text-sm">
                                  <span className="text-blue-600 hover:underline font-medium">
                                    Upload Cerebro CSV
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  or drag and drop
                                </p>
                              </div>
                            </div>
                          </Label>
                          <Input
                            id="keyword-bank-upload"
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </div>
                      </div>
                    ) : (
                      /* Full Keyword Features When Keywords Exist */
                      <>
                        {/* Re-upload Button */}
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
                                onChange={(e) =>
                                  setManualKeyword(e.target.value)
                                }
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
                                <div
                                  key={i}
                                  className="flex items-center gap-2"
                                >
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

                              {/* AI Filter Button */}
                              <div className="space-y-1.5">
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="w-full bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                                  onClick={async () => {
                                    // TODO: Wire up AI filtering logic
                                    setIsAiFiltering(true);

                                    // Simulate AI processing (remove when real AI is implemented)
                                    await new Promise((resolve) =>
                                      setTimeout(resolve, 2000)
                                    );

                                    console.log(
                                      "AI Filter: Analyzing keywords for relevance..."
                                    );
                                    console.log(
                                      "Product context:",
                                      productCharacteristics
                                    );
                                    console.log(
                                      "Total keywords to analyze:",
                                      keywords.length
                                    );

                                    // TODO: Call AI API endpoint to:
                                    // 1. Analyze product characteristics
                                    // 2. Score each keyword for relevance
                                    // 3. Remove keywords with low relevance scores
                                    // 4. Update keywords state with filtered list

                                    setIsAiFiltering(false);
                                  }}
                                  disabled={
                                    keywords.length === 0 ||
                                    isAiFiltering ||
                                    !productCharacteristics.trim()
                                  }
                                >
                                  {isAiFiltering ? (
                                    <>
                                      <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                                      Analyzing Keywords...
                                    </>
                                  ) : (
                                    <>
                                      <SparklesIcon className="mr-2 h-4 w-4" />
                                      AI Filter Irrelevant Keywords
                                    </>
                                  )}
                                </Button>
                                {!productCharacteristics.trim() &&
                                  keywords.length > 0 && (
                                    <p className="text-xs text-muted-foreground text-center">
                                      Add product characteristics in AI
                                      Parameters to enable
                                    </p>
                                  )}
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
                                              <span
                                                className={`truncate ${
                                                  isUsed ? "line-through" : ""
                                                }`}
                                              >
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
                                              ? `${(
                                                  kw.searchVolume / 1000
                                                ).toFixed(1)}k`
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
                                      setCurrentPage(
                                        Math.max(1, currentPage - 1)
                                      )
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
                                        page === currentPage
                                          ? "default"
                                          : "outline"
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
                      </>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Root Keywords Section - Below Main Table */}
            {keywords.length > 0 &&
              (() => {
                // Filter keywords for Root Keywords section only
                const rootFilteredKeywords = keywords.filter((kw) => {
                  const wordCount = getWordCount(kw.phrase);
                  if (rootWordFilter === "1") return wordCount === 1;
                  if (rootWordFilter === "2") return wordCount === 2;
                  if (rootWordFilter === "3+") return wordCount >= 3;
                  return true;
                });

                // Sort filtered root keywords
                const rootSortedKeywords = [...rootFilteredKeywords].sort(
                  (a, b) => {
                    return b.searchVolume - a.searchVolume;
                  }
                );

                return (
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
                                Root Keywords ({rootFilteredKeywords.length})
                              </CardTitle>
                              <CardDescription>
                                {rootKeywordsOpen
                                  ? "Sorted by phrase frequency"
                                  : `${
                                      rootWordFilter === "1"
                                        ? "1 word phrases"
                                        : rootWordFilter === "2"
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
                            Alone, base keywords are not that useful for your
                            KFS, but understanding which keyword phrases work
                            best to include the most base keywords
                          </div>

                          {/* Filter Buttons */}
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              variant={
                                rootWordFilter === "1" ? "default" : "outline"
                              }
                              onClick={() => {
                                setRootWordFilter("1");
                              }}
                              className="text-xs"
                            >
                              1 Word Roots
                            </Button>
                            <Button
                              size="sm"
                              variant={
                                rootWordFilter === "2" ? "default" : "outline"
                              }
                              onClick={() => {
                                setRootWordFilter("2");
                              }}
                              className="text-xs"
                            >
                              2 Word Roots
                            </Button>
                            <Button
                              size="sm"
                              variant={
                                rootWordFilter === "3+" ? "default" : "outline"
                              }
                              onClick={() => {
                                setRootWordFilter("3+");
                              }}
                              className="text-xs"
                            >
                              3+ Word Roots
                            </Button>
                          </div>

                          {/* Root Keywords as Clickable Tags */}
                          <div className="flex flex-wrap gap-2">
                            {rootSortedKeywords.map((kw, index) => {
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
                );
              })()}

            {/* Listing Analysis Card */}
            <Collapsible defaultOpen={true}>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="cursor-pointer">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        Listing Analysis
                      </CardTitle>
                      <ChevronDownIcon className="h-5 w-5 transition-transform" />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-6">
                    {/* Comprehensive Metrics Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Overall Listing Score */}
                      <div className="space-y-2 p-4 border rounded-lg bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                            Overall Listing Score
                          </span>
                          <span
                            className="text-xs text-muted-foreground cursor-help"
                            title="Comprehensive score based on content quality, keyword optimization, and conversion potential"
                          >
                            ⓘ
                          </span>
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                            {(() => {
                              // Calculate comprehensive score (0-100)
                              let score = 0;

                              // Content Completeness (30 points)
                              if (title) score += 8;
                              if (title.length >= 150) score += 7;
                              if (description) score += 8;
                              if (description.length >= 1000) score += 7;

                              // Bullet Points (20 points)
                              const filledBullets = [
                                bullet1,
                                bullet2,
                                bullet3,
                                bullet4,
                                bullet5,
                              ].filter((b) => b.trim()).length;
                              score += filledBullets * 4;

                              // Keyword Usage (25 points)
                              const usedKeywordsCount = keywords.filter(
                                (kw) => {
                                  const allText =
                                    `${title} ${bullet1} ${bullet2} ${bullet3} ${bullet4} ${bullet5} ${description}`.toLowerCase();
                                  const escapedPhrase = kw.phrase
                                    .toLowerCase()
                                    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                                  const regex = new RegExp(
                                    `\\b${escapedPhrase}\\b`,
                                    "g"
                                  );
                                  return regex.test(allText);
                                }
                              ).length;
                              const keywordUtilization =
                                keywords.length > 0
                                  ? (usedKeywordsCount /
                                      Math.min(keywords.length, 20)) *
                                    25
                                  : 0;
                              score += Math.min(keywordUtilization, 25);

                              // Best Practices (25 points)
                              if (title && !/[^\w\s-]/.test(title)) score += 5;
                              const words = title.toLowerCase().split(/\s+/);
                              const wordCount = words.reduce(
                                (acc: Record<string, number>, word) => {
                                  if (word.length > 3)
                                    acc[word] = (acc[word] || 0) + 1;
                                  return acc;
                                },
                                {}
                              );
                              const hasRepeat = Object.values(wordCount).some(
                                (count) => count > 2
                              );
                              if (!hasRepeat && title) score += 5;
                              if (filledBullets >= 5) score += 5;
                              if (
                                [bullet1, bullet2, bullet3, bullet4, bullet5]
                                  .filter((b) => b)
                                  .every((b) => /^[A-Z]/.test(b)) &&
                                bullet1
                              )
                                score += 5;
                              if (
                                [
                                  bullet1,
                                  bullet2,
                                  bullet3,
                                  bullet4,
                                  bullet5,
                                ].every((b) => !b || b.length >= 150)
                              )
                                score += 5;

                              return Math.round(score);
                            })()}
                          </div>
                          <span className="text-lg text-muted-foreground mb-1">
                            /100
                          </span>
                        </div>
                        <div className="h-3 bg-white/50 dark:bg-black/20 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-linear-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                            style={{
                              width: `${(() => {
                                let score = 0;
                                if (title) score += 8;
                                if (title.length >= 150) score += 7;
                                if (description) score += 8;
                                if (description.length >= 1000) score += 7;
                                const filledBullets = [
                                  bullet1,
                                  bullet2,
                                  bullet3,
                                  bullet4,
                                  bullet5,
                                ].filter((b) => b.trim()).length;
                                score += filledBullets * 4;
                                const usedKeywordsCount = keywords.filter(
                                  (kw) => {
                                    const allText =
                                      `${title} ${bullet1} ${bullet2} ${bullet3} ${bullet4} ${bullet5} ${description}`.toLowerCase();
                                    const escapedPhrase = kw.phrase
                                      .toLowerCase()
                                      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                                    const regex = new RegExp(
                                      `\\b${escapedPhrase}\\b`,
                                      "g"
                                    );
                                    return regex.test(allText);
                                  }
                                ).length;
                                const keywordUtilization =
                                  keywords.length > 0
                                    ? (usedKeywordsCount /
                                        Math.min(keywords.length, 20)) *
                                      25
                                    : 0;
                                score += Math.min(keywordUtilization, 25);
                                if (title && !/[^\w\s-]/.test(title))
                                  score += 5;
                                const words = title.toLowerCase().split(/\s+/);
                                const wordCount = words.reduce(
                                  (acc: Record<string, number>, word) => {
                                    if (word.length > 3)
                                      acc[word] = (acc[word] || 0) + 1;
                                    return acc;
                                  },
                                  {}
                                );
                                const hasRepeat = Object.values(wordCount).some(
                                  (count) => count > 2
                                );
                                if (!hasRepeat && title) score += 5;
                                if (filledBullets >= 5) score += 5;
                                if (
                                  [bullet1, bullet2, bullet3, bullet4, bullet5]
                                    .filter((b) => b)
                                    .every((b) => /^[A-Z]/.test(b)) &&
                                  bullet1
                                )
                                  score += 5;
                                if (
                                  [
                                    bullet1,
                                    bullet2,
                                    bullet3,
                                    bullet4,
                                    bullet5,
                                  ].every((b) => !b || b.length >= 150)
                                )
                                  score += 5;
                                return Math.round(score);
                              })()}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* SEO Strength Score */}
                      <div className="space-y-2 p-4 border rounded-lg">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold">
                            SEO Strength
                          </span>
                          <span
                            className="text-xs text-muted-foreground cursor-help"
                            title="Keyword density, distribution, and search volume potential"
                          >
                            ⓘ
                          </span>
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                            {(() => {
                              const usedKeywords = keywords.filter((kw) => {
                                const allText =
                                  `${title} ${bullet1} ${bullet2} ${bullet3} ${bullet4} ${bullet5} ${description}`.toLowerCase();
                                const escapedPhrase = kw.phrase
                                  .toLowerCase()
                                  .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                                const regex = new RegExp(
                                  `\\b${escapedPhrase}\\b`,
                                  "g"
                                );
                                return regex.test(allText);
                              });

                              // High-volume keywords bonus
                              const highVolumeKeywords = usedKeywords.filter(
                                (kw) => kw.searchVolume > 5000
                              ).length;

                              // Calculate SEO score
                              const utilizationScore =
                                keywords.length > 0
                                  ? (usedKeywords.length /
                                      Math.min(keywords.length, 25)) *
                                    60
                                  : 0;
                              const volumeBonus = highVolumeKeywords * 5;
                              const distributionBonus =
                                title && description && bullet1 ? 20 : 10;

                              return Math.min(
                                100,
                                Math.round(
                                  utilizationScore +
                                    volumeBonus +
                                    distributionBonus
                                )
                              );
                            })()}
                          </div>
                          <span className="text-base text-muted-foreground mb-1">
                            /100
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {
                            keywords.filter((kw) => {
                              const allText =
                                `${title} ${bullet1} ${bullet2} ${bullet3} ${bullet4} ${bullet5} ${description}`.toLowerCase();
                              const escapedPhrase = kw.phrase
                                .toLowerCase()
                                .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                              const regex = new RegExp(
                                `\\b${escapedPhrase}\\b`,
                                "g"
                              );
                              return regex.test(allText);
                            }).length
                          }{" "}
                          of {keywords.length} keywords indexed
                        </div>
                      </div>

                      {/* Content Richness */}
                      <div className="space-y-2 p-4 border rounded-lg">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold">
                            Content Richness
                          </span>
                          <span
                            className="text-xs text-muted-foreground cursor-help"
                            title="Measures detail depth, character count, and information completeness"
                          >
                            ⓘ
                          </span>
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                            {(() => {
                              const totalChars =
                                title.length +
                                description.length +
                                [
                                  bullet1,
                                  bullet2,
                                  bullet3,
                                  bullet4,
                                  bullet5,
                                ].reduce((sum, b) => sum + b.length, 0);

                              // Ideal total: 2500+ characters
                              const charScore = Math.min(
                                100,
                                (totalChars / 2500) * 100
                              );
                              return Math.round(charScore);
                            })()}
                          </div>
                          <span className="text-base text-muted-foreground mb-1">
                            /100
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(
                            title.length +
                            description.length +
                            [
                              bullet1,
                              bullet2,
                              bullet3,
                              bullet4,
                              bullet5,
                            ].reduce((sum, b) => sum + b.length, 0)
                          ).toLocaleString()}{" "}
                          total characters
                        </div>
                      </div>

                      {/* Conversion Potential */}
                      <div className="space-y-2 p-4 border rounded-lg">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold">
                            Conversion Potential
                          </span>
                          <span
                            className="text-xs text-muted-foreground cursor-help"
                            title="Search volume reach from indexed keywords and listing appeal"
                          >
                            ⓘ
                          </span>
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                            {generatedVolume >= 1000000
                              ? `${(generatedVolume / 1000000).toFixed(1)}M`
                              : generatedVolume >= 1000
                              ? `${(generatedVolume / 1000).toFixed(1)}K`
                              : generatedVolume.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Monthly search volume reach
                        </div>
                      </div>
                    </div>

                    {/* Best Practices Section */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold">Best Practices</h4>
                      <div className="space-y-2">
                        {/* Title checks */}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Title does not contain symbols or emojis
                          </span>
                          <span
                            className={
                              title && !/[^\w\s-]/.test(title)
                                ? "text-green-600"
                                : "text-muted-foreground"
                            }
                          >
                            {title && !/[^\w\s-]/.test(title) ? "✓" : "○"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Title contains 150+ characters
                          </span>
                          <span
                            className={
                              title.length >= 150
                                ? "text-green-600"
                                : "text-muted-foreground"
                            }
                          >
                            {title.length >= 150 ? "✓" : "○"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Title does not contain same word &gt;2 times
                          </span>
                          <span
                            className={(() => {
                              const words = title.toLowerCase().split(/\s+/);
                              const wordCount = words.reduce(
                                (acc: Record<string, number>, word) => {
                                  if (word.length > 3)
                                    acc[word] = (acc[word] || 0) + 1;
                                  return acc;
                                },
                                {}
                              );
                              const hasRepeat = Object.values(wordCount).some(
                                (count) => count > 2
                              );
                              return !hasRepeat && title
                                ? "text-green-600"
                                : "text-red-600";
                            })()}
                          >
                            {(() => {
                              const words = title.toLowerCase().split(/\s+/);
                              const wordCount = words.reduce(
                                (acc: Record<string, number>, word) => {
                                  if (word.length > 3)
                                    acc[word] = (acc[word] || 0) + 1;
                                  return acc;
                                },
                                {}
                              );
                              const hasRepeat = Object.values(wordCount).some(
                                (count) => count > 2
                              );
                              return !hasRepeat && title ? "✓" : "✗";
                            })()}
                          </span>
                        </div>

                        {/* Bullet points checks */}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            5+ bullet points
                          </span>
                          <span
                            className={
                              [
                                bullet1,
                                bullet2,
                                bullet3,
                                bullet4,
                                bullet5,
                              ].filter((b) => b.trim()).length >= 5
                                ? "text-green-600"
                                : "text-muted-foreground"
                            }
                          >
                            {[
                              bullet1,
                              bullet2,
                              bullet3,
                              bullet4,
                              bullet5,
                            ].filter((b) => b.trim()).length >= 5
                              ? "✓"
                              : "○"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            150+ characters in each bullet point
                          </span>
                          <span
                            className={
                              [
                                bullet1,
                                bullet2,
                                bullet3,
                                bullet4,
                                bullet5,
                              ].every((b) => b.length >= 150) && bullet1
                                ? "text-green-600"
                                : "text-muted-foreground"
                            }
                          >
                            {[
                              bullet1,
                              bullet2,
                              bullet3,
                              bullet4,
                              bullet5,
                            ].every((b) => b.length >= 150) && bullet1
                              ? "✓"
                              : "○"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            First letter of bullet points is capitalized
                          </span>
                          <span
                            className={
                              [bullet1, bullet2, bullet3, bullet4, bullet5]
                                .filter((b) => b)
                                .every((b) => /^[A-Z]/.test(b)) && bullet1
                                ? "text-green-600"
                                : "text-muted-foreground"
                            }
                          >
                            {[bullet1, bullet2, bullet3, bullet4, bullet5]
                              .filter((b) => b)
                              .every((b) => /^[A-Z]/.test(b)) && bullet1
                              ? "✓"
                              : "○"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Bullet points are not in all caps or contain icons
                          </span>
                          <span
                            className={
                              [bullet1, bullet2, bullet3, bullet4, bullet5]
                                .filter((b) => b)
                                .every(
                                  (b) =>
                                    b !== b.toUpperCase() &&
                                    !/[^\w\s.,!?-]/.test(b)
                                ) && bullet1
                                ? "text-green-600"
                                : "text-muted-foreground"
                            }
                          >
                            {[bullet1, bullet2, bullet3, bullet4, bullet5]
                              .filter((b) => b)
                              .every(
                                (b) =>
                                  b !== b.toUpperCase() &&
                                  !/[^\w\s.,!?-]/.test(b)
                              ) && bullet1
                              ? "✓"
                              : "○"}
                          </span>
                        </div>

                        {/* Description check */}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            1000+ characters in description or A+ content
                          </span>
                          <span
                            className={
                              description.length >= 1000
                                ? "text-green-600"
                                : "text-muted-foreground"
                            }
                          >
                            {description.length >= 1000 ? "✓" : "○"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
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
                        ? "Enter product characteristics, add your keywords, and automatically generate copy by clicking ‘Write it for me’ below."
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
                      generateContentMutation.mutate({
                        section: "description",
                      })
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

      {/* Add Keywords Dialog */}
      <Dialog open={addKeywordsDialog} onOpenChange={setAddKeywordsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Keywords Manually</DialogTitle>
            <DialogDescription>
              Enter keyword or phrase (press Enter to add)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              placeholder="Enter keywords separated by commas or new lines&#10;Example: honey, organic honey, raw honey"
              value={bulkKeywordText}
              onChange={(e) => setBulkKeywordText(e.target.value)}
              rows={8}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Press Enter to add, Shift+Enter for new line
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setAddKeywordsDialog(false);
                setBulkKeywordText("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (bulkKeywordText.trim()) {
                  // Split by comma or newline
                  const newKeywords = bulkKeywordText
                    .split(/[,\n]/)
                    .map((k) => k.trim())
                    .filter((k) => k.length > 0)
                    .map((phrase) => ({
                      phrase,
                      searchVolume: 0,
                      sales: 0,
                      cps: null,
                      selected: false,
                    }));

                  setKeywords((prev) => [...prev, ...newKeywords]);
                  setAddKeywordsDialog(false);
                  setBulkKeywordText("");
                }
              }}
              disabled={!bulkKeywordText.trim()}
            >
              + Add Keyword
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
