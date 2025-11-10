"use client";
import { useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronDownIcon,
  UploadIcon,
  PlusIcon,
  DownloadIcon,
  ArrowUpDownIcon,
  SparklesIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { UIKeyword, SortBy, ListingContent } from "../_types";
import { paginate, formatSearchVolume, keywordIsUsed } from "../_utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keywords: UIKeyword[];
  setKeywords: (k: UIKeyword[]) => void;
  manualKeyword: string;
  setManualKeyword: (v: string) => void;
  manualKeywordDialog: boolean;
  setManualKeywordDialog: (v: boolean) => void;
  emptyStateAddOpen: boolean;
  setEmptyStateAddOpen: (v: boolean) => void;
  isUploading: boolean;
  onUpload: (file: File) => void;
  onExport: () => void;
  sortBy: SortBy;
  setSortBy: (v: SortBy) => void;
  currentPage: number;
  setCurrentPage: (v: number) => void;
  perPage: number;
  content: ListingContent;
  canGenerate: boolean;
  generateTitle: () => void;
  generateBullets: () => void;
  generateDescription: () => void;
  generating: boolean;
  onToggleKeyword: (phrase: string) => void;
}

export function KeywordBank(props: Props) {
  const {
    open,
    onOpenChange,
    keywords,
    setKeywords,
    manualKeyword,
    setManualKeyword,
    manualKeywordDialog,
    setManualKeywordDialog,
    emptyStateAddOpen,
    setEmptyStateAddOpen,
    isUploading,
    onUpload,
    onExport,
    sortBy,
    setSortBy,
    currentPage,
    setCurrentPage,
    perPage,
    content,
    canGenerate,
    generateTitle,
    generateBullets,
    generateDescription,
    generating,
    onToggleKeyword,
  } = props;

  const selectedCount = keywords.filter((k) => k.selected).length;

  const sortedKeywords = [...keywords].sort((a, b) => {
    if (sortBy === "volume") return b.searchVolume - a.searchVolume;
    if (sortBy === "sales") return b.sales - a.sales;
    return a.phrase.localeCompare(b.phrase);
  });

  const totalPages = Math.ceil(sortedKeywords.length / perPage);
  const paginated = paginate(sortedKeywords, currentPage, perPage);

  // Clamp current page when keyword count or sorting changes
  useEffect(() => {
    if (totalPages === 0 && currentPage !== 1) setCurrentPage(1);
    else if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage, setCurrentPage]);

  return (
    <div className="space-y-4">
      {keywords.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Keyword Bank</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isUploading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                <div className="text-center py-4">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-blue-600"
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
                  <h4 className="font-semibold text-base mb-1.5">
                    You have no keywords yet
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Add keywords manually or use our guided builder to find
                    keywords
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => setEmptyStateAddOpen(!emptyStateAddOpen)}
                  >
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Add Keywords
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled
                  >
                    Find Keywords
                  </Button>
                </div>
                {emptyStateAddOpen && (
                  <div className="space-y-3">
                    <Textarea
                      id="empty-keyword-input"
                      placeholder="Enter keywords separated by commas, or one per line"
                      value={manualKeyword}
                      onChange={(e) => setManualKeyword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (manualKeyword.trim()) {
                            setKeywords([
                              ...keywords,
                              {
                                phrase: manualKeyword.trim(),
                                searchVolume: 0,
                                sales: 0,
                                cps: null,
                                selected: true,
                              },
                            ]);
                            setManualKeyword("");
                          }
                        }
                      }}
                      rows={8}
                      className="resize-none"
                    />
                    <div className="text-right text-xs text-muted-foreground">
                      {keywords.length} keywords
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        disabled
                      >
                        <DownloadIcon className="mr-2 h-4 w-4" />
                        Import keywords
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        disabled
                      >
                        <svg
                          className="mr-2 h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6h16M4 12h16M4 18h16"
                          />
                        </svg>
                        My List
                      </Button>
                    </div>
                  </div>
                )}
                {!emptyStateAddOpen && (
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
                )}
                {!emptyStateAddOpen && (
                  <div className="px-16">
                    <Label
                      htmlFor="keyword-bank-upload-empty"
                      className="cursor-pointer"
                    >
                      <div className="border-2 border-dashed rounded-lg p-2.5 hover:border-neutral-500 transition-colors">
                        <div className="flex items-center justify-center gap-2">
                          <UploadIcon className="h-5 w-5 text-muted-foreground" />
                          <div className="text-sm">
                            <span className="text-neutral-300 hover:underline font-medium">
                              Upload Cerebro CSV
                            </span>
                            <span className="text-xs text-muted-foreground ml-1">
                              or drag and drop
                            </span>
                          </div>
                        </div>
                      </div>
                    </Label>
                    <Input
                      id="keyword-bank-upload-empty"
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onUpload(file);
                      }}
                      className="hidden"
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ) : null}

      {keywords.length > 0 && (
        <Collapsible open={open} onOpenChange={onOpenChange}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">Keyword Bank</CardTitle>
                  </div>
                  <ChevronDownIcon
                    className={`h-5 w-5 transition-transform ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                </div>
                <CardDescription className="text-left">{`${keywords.length} keywords loaded`}</CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    (
                      document.getElementById(
                        "cerebro-upload-hidden"
                      ) as HTMLInputElement
                    )?.click()
                  }
                >
                  <UploadIcon className="mr-2 h-4 w-4" />
                  Upload New File
                </Button>
                <Input
                  id="cerebro-upload-hidden"
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onUpload(file);
                  }}
                  className="hidden"
                />

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
                      <PlusIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={onExport}
                      disabled={keywords.length === 0}
                      variant="outline"
                      className="flex-1"
                    >
                      <DownloadIcon className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
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
                            if (manualKeyword.trim()) {
                              setKeywords([
                                ...keywords,
                                {
                                  phrase: manualKeyword.trim(),
                                  searchVolume: 0,
                                  sales: 0,
                                  cps: null,
                                  selected: true,
                                },
                              ]);
                              setManualKeyword("");
                            }
                          }
                        }}
                        rows={3}
                        className="resize-none"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            if (manualKeyword.trim()) {
                              setKeywords([
                                ...keywords,
                                {
                                  phrase: manualKeyword.trim(),
                                  searchVolume: 0,
                                  sales: 0,
                                  cps: null,
                                  selected: true,
                                },
                              ]);
                              setManualKeyword("");
                            }
                          }}
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

                {/* Quick actions: Generate with AI and Filter */}
                {selectedCount > 0 && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={generateTitle}
                      disabled={generating || !canGenerate}
                      className="flex-1 text-xs"
                    >
                      + Product Title
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={generateBullets}
                      disabled={generating || !canGenerate}
                      className="flex-1 text-xs"
                    >
                      + Bullet Points
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={generateDescription}
                      disabled={generating || !canGenerate}
                      className="flex-1 text-xs"
                    >
                      + Description
                    </Button>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    onClick={async () => {
                      /* TODO: AI filtering */
                    }}
                    disabled={keywords.length === 0 || !canGenerate}
                  >
                    <SparklesIcon className="mr-2 h-4 w-4" />
                    AI Filter Irrelevant Keywords
                  </Button>
                </div>

                <TooltipProvider>
                  <div className="border rounded-lg">
                    <div className="grid grid-cols-[auto_1fr_40px_55px_50px_45px] gap-2 p-2 border-b bg-muted/50 text-xs font-medium">
                      <div></div>
                      <div>Keyword</div>
                      <div className="text-right">Used</div>
                      <button
                        onClick={() => {
                          setSortBy(sortBy === "volume" ? "alpha" : "volume");
                          setCurrentPage(1);
                        }}
                        className="flex items-center justify-end gap-1 hover:text-foreground transition-colors"
                      >
                        SV
                        <ArrowUpDownIcon className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => {
                          setSortBy(sortBy === "sales" ? "alpha" : "sales");
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
                      {paginated.map((kw, index) => {
                        const count = keywordIsUsed(kw.phrase, content);
                        const isUsed = count > 0;
                        return (
                          <div
                            key={index}
                            className={`grid grid-cols-[auto_1fr_40px_55px_50px_45px] gap-2 p-2 border-b text-xs hover:bg-muted/50 ${
                              isUsed ? "bg-green-50 dark:bg-green-950/30" : ""
                            }`}
                          >
                            <Checkbox
                              checked={kw.selected}
                              onCheckedChange={() => onToggleKeyword(kw.phrase)}
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
                              <TooltipContent side="top" className="max-w-xs">
                                <p>{kw.phrase}</p>
                              </TooltipContent>
                            </Tooltip>
                            <div className="text-right text-muted-foreground">
                              {count || ""}
                            </div>
                            <div className="text-right text-muted-foreground">
                              {kw.searchVolume > 0
                                ? formatSearchVolume(kw.searchVolume)
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

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-1 p-4 border-t">
                      {/* Prev */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0"
                        aria-label="Previous page"
                      >
                        ←
                      </Button>

                      {/* Ellipsed page items: always show 1, current±1, and last */}
                      {(() => {
                        const items: Array<number | string> = [];
                        const add = (v: number) => {
                          if (!items.includes(v)) items.push(v);
                        };
                        add(1);
                        if (currentPage - 1 > 1) add(currentPage - 1);
                        if (currentPage > 1 && currentPage < totalPages)
                          add(currentPage);
                        if (currentPage + 1 < totalPages) add(currentPage + 1);
                        add(totalPages);

                        const numbers = items
                          .filter((x): x is number => typeof x === "number")
                          .sort((a, b) => a - b);

                        const finalItems: Array<number | string> = [];
                        for (let i = 0; i < numbers.length; i++) {
                          const curr = numbers[i];
                          const prev = numbers[i - 1];
                          if (i === 0) {
                            finalItems.push(curr);
                          } else if (curr - (prev as number) === 2) {
                            finalItems.push((prev as number) + 1);
                            finalItems.push(curr);
                          } else if (curr - (prev as number) > 2) {
                            finalItems.push("…");
                            finalItems.push(curr);
                          } else {
                            finalItems.push(curr);
                          }
                        }

                        return finalItems.map((p, idx) =>
                          typeof p === "number" ? (
                            <Button
                              key={`p-${p}-${idx}`}
                              variant={
                                p === currentPage ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => setCurrentPage(p)}
                              className="h-8 w-8 p-0"
                              aria-current={
                                p === currentPage ? "page" : undefined
                              }
                            >
                              {p}
                            </Button>
                          ) : (
                            <Button
                              key={`dots-${idx}`}
                              variant="ghost"
                              size="sm"
                              disabled
                              className="h-8 w-8 p-0"
                              aria-hidden="true"
                            >
                              {p}
                            </Button>
                          )
                        );
                      })()}

                      {/* Next */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0"
                        aria-label="Next page"
                      >
                        →
                      </Button>
                    </div>
                  )}
                </TooltipProvider>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
    </div>
  );
}
