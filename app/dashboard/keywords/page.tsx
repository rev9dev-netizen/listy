"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2Icon,
  SearchIcon,
  FilterIcon,
  ExternalLinkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HistoryIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface Keyword {
  phrase: string;
  search_volume: number;
  organic_rank: number | null;
  sponsored_rank: number | null;
  competing_products: number;
  match_type: string;
}

interface ProductInfo {
  title: string;
  image: string;
  asin?: string;
  total_keywords: number;
  organic_keywords: number;
  paid_keywords: number;
  amazon_recommended: number;
  total_search_volume: number;
  avg_search_volume: number;
}

interface SearchHistory {
  id: string;
  asins: string[];
  marketplace: string;
  timestamp: Date;
  keywords: Keyword[];
  productInfo: ProductInfo;
}

export default function KeywordsPage() {
  // Search state
  const [marketplace, setMarketplace] = useState("www.amazon.com");
  const [asinInput, setAsinInput] = useState("");
  const [asinChips, setAsinChips] = useState<string[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Results state
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);

  // History state
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(
    null
  );

  // Filter state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isApplyingFilter, setIsApplyingFilter] = useState(false);
  const [wordCountMin, setWordCountMin] = useState("");
  const [wordCountMax, setWordCountMax] = useState("");
  const [searchVolumeMin, setSearchVolumeMin] = useState("");
  const [searchVolumeMax, setSearchVolumeMax] = useState("");
  const [organicRankMin, setOrganicRankMin] = useState("");
  const [organicRankMax, setOrganicRankMax] = useState("");
  const [sponsoredRankMin, setSponsoredRankMin] = useState("");
  const [sponsoredRankMax, setSponsoredRankMax] = useState("");
  const [matchType, setMatchType] = useState("all");
  const [phrasesContaining, setPhrasesContaining] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Local new searches (not yet persisted)
  const [localSearches, setLocalSearches] = useState<SearchHistory[]>([]);

  // Fetch search history from database
  const { data: historyData } = useQuery({
    queryKey: ["searchHistory"],
    queryFn: async () => {
      const response = await fetch("/api/keywords/history");
      if (!response.ok) throw new Error("Failed to fetch history");
      return response.json();
    },
  });

  // Combine database history with local searches
  const searchHistory = useMemo(() => {
    const dbHistory: SearchHistory[] = (historyData?.history || []).map(
      (h: {
        id: string;
        asins: string[];
        marketplace: string;
        createdAt: string;
        keywords: Keyword[];
        productInfo: ProductInfo;
      }) => ({
        id: h.id,
        asins: h.asins,
        marketplace: h.marketplace,
        timestamp: new Date(h.createdAt),
        keywords: h.keywords || [],
        productInfo: h.productInfo || ({} as ProductInfo),
      })
    );

    return [...localSearches, ...dbHistory].slice(0, 10);
  }, [historyData, localSearches]);

  const generateMutation = useMutation({
    mutationFn: async (asins: string[]) => {
      let marketplaceCode = "US";
      if (marketplace.includes("amazon.ca")) marketplaceCode = "CA";
      else if (marketplace.includes("amazon.com.mx")) marketplaceCode = "MX";
      else if (marketplace.includes("amazon.de")) marketplaceCode = "DE";
      else if (marketplace.includes("amazon.es")) marketplaceCode = "ES";
      else if (marketplace.includes("amazon.it")) marketplaceCode = "IT";
      else if (marketplace.includes("amazon.fr")) marketplaceCode = "FR";
      else if (marketplace.includes("amazon.co.uk")) marketplaceCode = "UK";
      else if (marketplace.includes("amazon.co.jp")) marketplaceCode = "JP";

      const response = await fetch("/api/keywords/cerebro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asins, marketplace: marketplaceCode }),
      });

      if (!response.ok) {
        const err = await response
          .json()
          .catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || "Failed to generate keywords");
      }

      return response.json();
    },
    onSuccess: async (data, asins) => {
      const newHistory: SearchHistory = {
        id: Date.now().toString(),
        asins,
        marketplace,
        timestamp: new Date(),
        keywords: data.keywords || [],
        productInfo: {
          ...data.productInfo,
          asin: asins[0], // Store first ASIN for product link
        },
      };

      setLocalSearches((prev) => [newHistory, ...prev.slice(0, 9)]); // Keep last 10
      setSelectedHistoryId(newHistory.id);
      setKeywords(newHistory.keywords);
      setProductInfo(newHistory.productInfo);
      setCurrentPage(1);

      // Save to database
      try {
        await fetch("/api/keywords/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            asins,
            marketplace,
            keywords: data.keywords || [],
            productInfo: {
              ...data.productInfo,
              asin: asins[0],
            },
          }),
        });
      } catch (error) {
        console.error("Failed to save history to database:", error);
      }

      toast.success(
        `Fetched ${data.keywords?.length || 0} keywords from DataForSEO!`
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to generate keywords");
    },
  });

  // Handle ASIN input and chip creation
  const handleAsinInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      const trimmed = asinInput.trim();
      if (trimmed && !asinChips.includes(trimmed) && asinChips.length < 10) {
        setAsinChips([...asinChips, trimmed]);
        setAsinInput("");
      }
    }
  };

  const handleAsinInputBlur = () => {
    const trimmed = asinInput.trim();
    if (trimmed && !asinChips.includes(trimmed) && asinChips.length < 10) {
      setAsinChips([...asinChips, trimmed]);
      setAsinInput("");
    }
  };

  const removeAsinChip = (asin: string) => {
    setAsinChips(asinChips.filter((a) => a !== asin));
  };

  const handleSearch = () => {
    if (asinChips.length === 0) {
      toast.error("Please enter at least one ASIN");
      return;
    }

    if (asinChips.length > 10) {
      toast.error("Maximum 10 ASINs allowed");
      return;
    }

    // Check if this ASIN combo exists in history
    const existingHistory = searchHistory.find(
      (h) =>
        JSON.stringify(h.asins.sort()) ===
          JSON.stringify(asinChips.slice().sort()) &&
        h.marketplace === marketplace
    );

    if (existingHistory) {
      setSelectedHistoryId(existingHistory.id);
      setKeywords(existingHistory.keywords);
      setProductInfo(existingHistory.productInfo);
      setCurrentPage(1);
      toast.info("Loaded from history");
    } else {
      generateMutation.mutate(asinChips);
    }
  };

  const loadFromHistory = (historyId: string) => {
    const history = searchHistory.find((h) => h.id === historyId);
    if (history) {
      setSelectedHistoryId(historyId);
      setKeywords(history.keywords);
      setProductInfo(history.productInfo);
      setAsinChips(history.asins);
      setAsinInput("");
      setMarketplace(history.marketplace);
      setCurrentPage(1);
      toast.info("Loaded from history");
    }
  };

  // Apply filters with loading state
  const applyFilters = () => {
    setIsApplyingFilter(true);
    setTimeout(() => {
      setIsApplyingFilter(false);
      setCurrentPage(1);
    }, 300);
  };

  // Filtered keywords
  const filteredKeywords = useMemo(() => {
    return keywords.filter((k) => {
      const wordCount = k.phrase.split(" ").length;
      if (wordCountMin && wordCount < parseInt(wordCountMin)) return false;
      if (wordCountMax && wordCount > parseInt(wordCountMax)) return false;
      if (searchVolumeMin && k.search_volume < parseInt(searchVolumeMin))
        return false;
      if (searchVolumeMax && k.search_volume > parseInt(searchVolumeMax))
        return false;
      if (
        organicRankMin &&
        (!k.organic_rank || k.organic_rank < parseInt(organicRankMin))
      )
        return false;
      if (
        organicRankMax &&
        (!k.organic_rank || k.organic_rank > parseInt(organicRankMax))
      )
        return false;
      if (
        sponsoredRankMin &&
        (!k.sponsored_rank || k.sponsored_rank < parseInt(sponsoredRankMin))
      )
        return false;
      if (
        sponsoredRankMax &&
        (!k.sponsored_rank || k.sponsored_rank > parseInt(sponsoredRankMax))
      )
        return false;
      if (
        phrasesContaining &&
        !k.phrase.toLowerCase().includes(phrasesContaining.toLowerCase())
      )
        return false;
      if (matchType && matchType !== "all" && k.match_type !== matchType)
        return false;
      return true;
    });
  }, [
    keywords,
    wordCountMin,
    wordCountMax,
    searchVolumeMin,
    searchVolumeMax,
    organicRankMin,
    organicRankMax,
    sponsoredRankMin,
    sponsoredRankMax,
    phrasesContaining,
    matchType,
  ]);

  // Paginated keywords
  const paginatedKeywords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredKeywords.slice(startIndex, endIndex);
  }, [filteredKeywords, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredKeywords.length / itemsPerPage);

  const getMarketplaceDomain = () => {
    let domain = "amazon.com";
    if (marketplace.includes("amazon.ca")) domain = "amazon.ca";
    else if (marketplace.includes("amazon.com.mx")) domain = "amazon.com.mx";
    else if (marketplace.includes("amazon.de")) domain = "amazon.de";
    else if (marketplace.includes("amazon.es")) domain = "amazon.es";
    else if (marketplace.includes("amazon.it")) domain = "amazon.it";
    else if (marketplace.includes("amazon.fr")) domain = "amazon.fr";
    else if (marketplace.includes("amazon.co.uk")) domain = "amazon.co.uk";
    else if (marketplace.includes("amazon.co.jp")) domain = "amazon.co.jp";
    return domain;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reverse ASIN Lookup</h1>
          <p className="text-muted-foreground">
            Enter up to 10 product identifiers to find their top performing
            keywords (Last 30 days data)
          </p>
        </div>

        {/* History Button - Above search */}
        <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="lg">
              <HistoryIcon className="w-4 h-4 mr-2" />
              History
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[400px] sm:w-[540px]">
            <SheetHeader>
              <SheetTitle>Search History</SheetTitle>
              <SheetDescription>
                Your recent ASIN searches (last 10)
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              {searchHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No search history yet
                </p>
              ) : (
                searchHistory.map((history) => (
                  <Card
                    key={history.id}
                    className={`cursor-pointer transition-colors hover:border-primary ${
                      selectedHistoryId === history.id
                        ? "border-primary bg-accent"
                        : ""
                    }`}
                    onClick={() => {
                      loadFromHistory(history.id);
                      setIsHistoryOpen(false);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">
                            {history.asins.join(", ")}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(history.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">
                            {history.keywords.length} keywords
                          </span>
                          <span className="text-muted-foreground">
                            {history.marketplace}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Search Bar with Integrated Marketplace */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            {/* Search Input Container with Marketplace Inside */}
            <div className="flex-1 flex items-center gap-2 border rounded-lg p-1 min-h-12 focus-within:ring-2 focus-within:ring-ring">
              {/* Marketplace Selector Inside */}
              <Select value={marketplace} onValueChange={setMarketplace}>
                <SelectTrigger className="w-[140px] h-8 border-0 shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="www.amazon.com">🇺🇸 US</SelectItem>
                  <SelectItem value="www.amazon.ca">🇨🇦 CA</SelectItem>
                  <SelectItem value="www.amazon.com.mx">🇲🇽 MX</SelectItem>
                  <SelectItem value="www.amazon.de">🇩🇪 DE</SelectItem>
                  <SelectItem value="www.amazon.es">🇪🇸 ES</SelectItem>
                  <SelectItem value="www.amazon.it">🇮🇹 IT</SelectItem>
                  <SelectItem value="www.amazon.fr">🇫🇷 FR</SelectItem>
                  <SelectItem value="www.amazon.co.uk">🇬🇧 UK</SelectItem>
                </SelectContent>
              </Select>

              <div className="w-px h-8 bg-border" />

              {/* ASIN Chips Container */}
              <div className="flex-1 flex items-center gap-2 flex-wrap">
                {asinChips.map((asin) => (
                  <Badge
                    key={asin}
                    variant="secondary"
                    className="h-7 px-2 gap-1"
                  >
                    {asin}
                    <button
                      onClick={() => removeAsinChip(asin)}
                      className="ml-1 hover:bg-destructive/20 rounded-full"
                      type="button"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                {asinChips.length < 10 && (
                  <Input
                    placeholder="Enter ASIN..."
                    value={asinInput}
                    onChange={(e) => setAsinInput(e.target.value)}
                    onKeyDown={handleAsinInputKeyDown}
                    onBlur={handleAsinInputBlur}
                    className="flex-1 min-w-[120px] border-0 shadow-none h-8 focus-visible:ring-0 px-0"
                  />
                )}
              </div>
            </div>

            {/* Search Button - Same Height */}
            <Button
              onClick={handleSearch}
              disabled={generateMutation.isPending || asinChips.length === 0}
              size="lg"
              className="h-12 px-6"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <SearchIcon className="w-4 h-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {productInfo && keywords.length > 0 && (
        <>
          {/* Product Info with Image */}
          <Card>
            <CardContent className="">
              <div className="flex items-center gap-4">
                {productInfo.asin && (
                  <a
                    href={`https://${getMarketplaceDomain()}/dp/${
                      productInfo.asin
                    }`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative w-24 h-24 shrink-0 border rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                  >
                    <Image
                      src={productInfo.image || "/placeholder-product.jpg"}
                      alt={productInfo.title}
                      fill
                      className="object-contain"
                    />
                  </a>
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-semibold">{productInfo.title}</h2>
                  <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                    <span>Total: {productInfo.total_keywords}</span>
                    <span>Organic: {productInfo.organic_keywords}</span>
                    <span>Sponsored: {productInfo.paid_keywords}</span>
                    <span>
                      Avg SV: {productInfo.avg_search_volume.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                  >
                    <FilterIcon className="w-4 h-4 mr-2" />
                    {isFilterOpen ? "Hide" : "Show"} Filters
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredKeywords.length} of {keywords.length}{" "}
                    keywords
                  </div>
                </div>

                {isFilterOpen && (
                  <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                    {/* Word Count */}
                    <div className="space-y-2">
                      <Label className="text-xs">Word Count</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={wordCountMin}
                          onChange={(e) => {
                            setWordCountMin(e.target.value);
                            applyFilters();
                          }}
                          className="h-8"
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={wordCountMax}
                          onChange={(e) => {
                            setWordCountMax(e.target.value);
                            applyFilters();
                          }}
                          className="h-8"
                        />
                      </div>
                    </div>

                    {/* Search Volume */}
                    <div className="space-y-2">
                      <Label className="text-xs">Search Volume</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={searchVolumeMin}
                          onChange={(e) => {
                            setSearchVolumeMin(e.target.value);
                            applyFilters();
                          }}
                          className="h-8"
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={searchVolumeMax}
                          onChange={(e) => {
                            setSearchVolumeMax(e.target.value);
                            applyFilters();
                          }}
                          className="h-8"
                        />
                      </div>
                    </div>

                    {/* Organic Rank */}
                    <div className="space-y-2">
                      <Label className="text-xs">Organic Rank</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={organicRankMin}
                          onChange={(e) => {
                            setOrganicRankMin(e.target.value);
                            applyFilters();
                          }}
                          className="h-8"
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={organicRankMax}
                          onChange={(e) => {
                            setOrganicRankMax(e.target.value);
                            applyFilters();
                          }}
                          className="h-8"
                        />
                      </div>
                    </div>

                    {/* Match Type */}
                    <div className="space-y-2">
                      <Label className="text-xs">Match Type</Label>
                      <Select
                        value={matchType}
                        onValueChange={(v) => {
                          setMatchType(v);
                          applyFilters();
                        }}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="O">Organic</SelectItem>
                          <SelectItem value="SP">Sponsored</SelectItem>
                          <SelectItem value="O+SP">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Phrase Search */}
                    <div className="space-y-2 col-span-2">
                      <Label className="text-xs">Contains Phrase</Label>
                      <Input
                        placeholder="Search in keywords..."
                        value={phrasesContaining}
                        onChange={(e) => {
                          setPhrasesContaining(e.target.value);
                          applyFilters();
                        }}
                        className="h-8"
                      />
                    </div>

                    {/* Clear Filters */}
                    <div className="space-y-2 col-span-2 flex items-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-8"
                        onClick={() => {
                          setWordCountMin("");
                          setWordCountMax("");
                          setSearchVolumeMin("");
                          setSearchVolumeMax("");
                          setOrganicRankMin("");
                          setOrganicRankMax("");
                          setSponsoredRankMin("");
                          setSponsoredRankMax("");
                          setMatchType("all");
                          setPhrasesContaining("");
                          applyFilters();
                        }}
                      >
                        Clear All Filters
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="pt-0">
              {/* Pagination Controls - Top */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Rows per page:
                  </span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(v) => {
                      setItemsPerPage(parseInt(v));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="500">500</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages} (
                    {filteredKeywords.length} keywords)
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRightIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Keyword</TableHead>
                      <TableHead className="text-right">
                        Search Volume
                      </TableHead>
                      <TableHead className="text-center">
                        Organic Rank
                      </TableHead>
                      <TableHead className="text-center">
                        Sponsored Rank
                      </TableHead>
                      <TableHead className="text-center">Competing</TableHead>
                      <TableHead className="text-center">Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isApplyingFilter ? (
                      // Skeleton loading
                      Array.from({ length: 10 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-16 ml-auto" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-12 mx-auto" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-12 mx-auto" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-8 mx-auto" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-16 mx-auto" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : paginatedKeywords.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No keywords match your filters
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedKeywords.map((keyword, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="flex-1">{keyword.phrase}</span>
                              <a
                                href={`https://${getMarketplaceDomain()}/s?k=${encodeURIComponent(
                                  keyword.phrase
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <ExternalLinkIcon className="w-4 h-4" />
                              </a>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {keyword.search_volume.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center">
                            {keyword.organic_rank ? (
                              <Badge variant="secondary" className="text-xs">
                                #{keyword.organic_rank}
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {keyword.sponsored_rank ? (
                              <Badge variant="secondary" className="text-xs">
                                #{keyword.sponsored_rank}
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {keyword.competing_products}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-xs">
                              {keyword.match_type}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls - Bottom */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredKeywords.length
                  )}{" "}
                  of {filteredKeywords.length}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeftIcon className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRightIcon className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
