"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Loader2Icon,
  SearchIcon,
  FilterIcon,
  DownloadIcon,
  SettingsIcon,
  InfoIcon,
} from "lucide-react";
import { toast } from "sonner";

interface Keyword {
  phrase: string;
  search_volume: number;
  organic_rank: number | null;
  sponsored_rank: number | null;
  competing_products: number;
  match_type: string;
}

export default function KeywordsPage() {
  // Stage 1: Initial form
  const [showResults, setShowResults] = useState(false);
  const [marketplace, setMarketplace] = useState("www.amazon.com");
  const [asinInput, setAsinInput] = useState("");
  const [excludeVariations, setExcludeVariations] = useState(false);

  // Stage 2: Results with filters
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [productInfo, setProductInfo] = useState({
    title: "",
    image: "",
    total_keywords: 0,
    organic_keywords: 0,
    paid_keywords: 0,
    amazon_recommended: 0,
    total_search_volume: 0,
    avg_search_volume: 0,
  });

  // Filters
  const [wordCountMin, setWordCountMin] = useState("");
  const [wordCountMax, setWordCountMax] = useState("");
  const [searchVolumeMin, setSearchVolumeMin] = useState("");
  const [searchVolumeMax, setSearchVolumeMax] = useState("");
  const [organicRankMin, setOrganicRankMin] = useState("");
  const [organicRankMax, setOrganicRankMax] = useState("");
  const [sponsoredRankMin, setSponsoredRankMin] = useState("");
  const [sponsoredRankMax, setSponsoredRankMax] = useState("");
  const [matchType, setMatchType] = useState("None selected");
  const [phrasesContaining, setPhrasesContaining] = useState("");

  const generateMutation = useMutation({
    mutationFn: async (asins: string[]) => {
      // Parse marketplace correctly
      let marketplaceCode = "US";
      if (marketplace.includes("amazon.ca")) marketplaceCode = "CA";
      else if (marketplace.includes("amazon.com.mx")) marketplaceCode = "MX";
      else if (marketplace.includes("amazon.de")) marketplaceCode = "DE";
      else if (marketplace.includes("amazon.es")) marketplaceCode = "ES";
      else if (marketplace.includes("amazon.it")) marketplaceCode = "IT";
      else if (marketplace.includes("amazon.fr")) marketplaceCode = "FR";
      else if (marketplace.includes("amazon.co.uk")) marketplaceCode = "UK";
      else if (marketplace.includes("amazon.co.jp")) marketplaceCode = "JP";

      console.log("Sending to API:", { asins, marketplace: marketplaceCode });

      const response = await fetch("/api/keywords/cerebro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asins,
          marketplace: marketplaceCode,
        }),
      });
      if (!response.ok) {
        const err = await response
          .json()
          .catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || "Failed to generate keywords");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setKeywords(data.keywords || []);
      setProductInfo(
        data.productInfo || {
          title: "Product Analysis",
          image: "/placeholder-product.jpg",
          total_keywords: 0,
          organic_keywords: 0,
          paid_keywords: 0,
          amazon_recommended: 0,
          total_search_volume: 0,
          avg_search_volume: 0,
        }
      );
      setShowResults(true);
      toast.success(
        `Fetched ${data.keywords?.length || 0} real keywords from DataForSEO!`
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to generate keywords");
    },
  });

  const handleSearch = () => {
    const asins = asinInput
      .split(/[\n,\s]/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (asins.length === 0) {
      toast.error("Please enter at least one ASIN");
      return;
    }

    if (asins.length > 10) {
      toast.error("Maximum 10 ASINs allowed");
      return;
    }

    generateMutation.mutate(asins);
  };

  const filteredKeywords = keywords.filter((k) => {
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
      phrasesContaining &&
      !k.phrase.toLowerCase().includes(phrasesContaining.toLowerCase())
    )
      return false;
    if (
      matchType &&
      matchType !== "None selected" &&
      k.match_type !== matchType
    )
      return false;
    return true;
  });

  // Stage 1: Initial Search Form
  if (!showResults) {
    return (
      <div className="max-w-full mx-auto space-y-6 py-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl text-left font-bold">Reverse ASIN Lookup</h1>
          <p className="text-muted-foreground text-left">
            Enter up to 10 product identifiers to find their top performing
            keywords.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Marketplace Selector & ASIN Input */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 min-w-[200px]">
                <div className="w-8 h-6 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">
                  🇺🇸
                </div>
                <Select value={marketplace} onValueChange={setMarketplace}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="www.amazon.com">
                      🇺🇸 www.amazon.com
                    </SelectItem>
                    <SelectItem value="www.amazon.ca">
                      🇨🇦 www.amazon.ca
                    </SelectItem>
                    <SelectItem value="www.amazon.com.mx">
                      🇲🇽 www.amazon.com.mx
                    </SelectItem>
                    <SelectItem value="www.amazon.de">
                      🇩🇪 www.amazon.de
                    </SelectItem>
                    <SelectItem value="www.amazon.es">
                      🇪🇸 www.amazon.es
                    </SelectItem>
                    <SelectItem value="www.amazon.it">
                      🇮🇹 www.amazon.it
                    </SelectItem>
                    <SelectItem value="www.amazon.fr">
                      🇫🇷 www.amazon.fr
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* ASIN Input */}
              <div className="flex-1">
                <Textarea
                  placeholder="Enter up to 10 product identifiers for keyword comparison"
                  value={asinInput}
                  onChange={(e) => setAsinInput(e.target.value)}
                  rows={1}
                  className="resize-none"
                />
              </div>

              {/* Search Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleSearch}
                  disabled={generateMutation.isPending}
                  size="lg"
                >
                  {generateMutation.isPending ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    "Get Keywords"
                  )}
                </Button>
                <Button variant="outline" size="lg">
                  Get Competitors
                </Button>
              </div>
            </div>

            {/* Exclude Variations Checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="excludeVariations"
                checked={excludeVariations}
                onChange={(e) => setExcludeVariations(e.target.checked)}
                className="rounded"
              />
              <Label
                htmlFor="excludeVariations"
                className="text-sm cursor-pointer"
              >
                Exclude variations
              </Label>
              <InfoIcon className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-lg mb-2">
              Search specific products from Amazon and find their top ranking
              keywords
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Leverage your competitors&apos; keyword ranking strategy to
              improve your own listing. You can also use Cerebro to gauge the
              most effective keywords for your product on Amazon, optimize your
              product listing to boost sales, and keep competitive rates on your
              products. Cerebro is key in successfully launching new products
              and bringing more awareness to your brand.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Stage 2: Results with Filters
  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FilterIcon className="h-5 w-5" />
              <h3 className="font-semibold">Filters</h3>
            </div>
            <Button
              variant="link"
              className="text-sm"
              onClick={() => setShowResults(false)}
            >
              ← Back to Search
            </Button>
          </div>

          <div className="space-y-4">
            {/* Filter Presets */}
            <div className="flex gap-2">
              <Badge variant="outline" className="cursor-pointer">
                Exclude Special Characters
              </Badge>
              <Badge variant="outline" className="cursor-pointer">
                Brand Name Removal
              </Badge>
              <Badge variant="outline" className="cursor-pointer">
                New Filter
              </Badge>
              <Button variant="outline" size="sm">
                <FilterIcon className="h-4 w-4 mr-2" />
                Filter Library
              </Button>
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-5 gap-4">
              {/* Word Count */}
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-1">
                  Word Count{" "}
                  <InfoIcon className="h-3 w-3 text-muted-foreground" />
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={wordCountMin}
                    onChange={(e) => setWordCountMin(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={wordCountMax}
                    onChange={(e) => setWordCountMax(e.target.value)}
                  />
                </div>
              </div>

              {/* Search Volume */}
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-1">
                  Search Volume{" "}
                  <InfoIcon className="h-3 w-3 text-muted-foreground" />
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={searchVolumeMin}
                    onChange={(e) => setSearchVolumeMin(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={searchVolumeMax}
                    onChange={(e) => setSearchVolumeMax(e.target.value)}
                  />
                </div>
              </div>

              {/* Time Period */}
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-1">
                  Time Period{" "}
                  <InfoIcon className="h-3 w-3 text-muted-foreground" />
                </Label>
                <Input
                  type="text"
                  value="Current"
                  disabled
                  className="bg-muted"
                />
              </div>

              {/* Organic Rank */}
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-1">
                  Organic Rank{" "}
                  <InfoIcon className="h-3 w-3 text-muted-foreground" />
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={organicRankMin}
                    onChange={(e) => setOrganicRankMin(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={organicRankMax}
                    onChange={(e) => setOrganicRankMax(e.target.value)}
                  />
                </div>
              </div>

              {/* Match Type */}
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-1">
                  Match Type{" "}
                  <InfoIcon className="h-3 w-3 text-muted-foreground" />
                </Label>
                <Select value={matchType} onValueChange={setMatchType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="None selected">None selected</SelectItem>
                    <SelectItem value="AR">Amazon Recommended</SelectItem>
                    <SelectItem value="O">Organic</SelectItem>
                    <SelectItem value="SP">Sponsored</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Phrases Containing */}
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-1">
                  Phrases Containing{" "}
                  <InfoIcon className="h-3 w-3 text-muted-foreground" />
                </Label>
                <Input
                  placeholder="Ex. red dress"
                  value={phrasesContaining}
                  onChange={(e) => setPhrasesContaining(e.target.value)}
                />
              </div>

              {/* Sponsored Rank */}
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-1">
                  Sponsored Rank{" "}
                  <InfoIcon className="h-3 w-3 text-muted-foreground" />
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={sponsoredRankMin}
                    onChange={(e) => setSponsoredRankMin(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={sponsoredRankMax}
                    onChange={(e) => setSponsoredRankMax(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Monthly uses: <span className="font-semibold">1/1,000</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Save as Filter Preset</Button>
              <Button variant="outline">Clear</Button>
              <Button>Apply Filters</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Info & Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            {/* Product Image & Title */}
            <div className="flex gap-4 flex-1">
              <div className="w-20 h-20 bg-muted rounded flex items-center justify-center">
                <span className="text-xs text-muted-foreground">Image</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm line-clamp-2">
                  {productInfo.title}
                </h3>
                <div className="flex gap-4 mt-2">
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                  >
                    Run Listing Analyzer
                  </Button>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                  >
                    Track Competitors
                  </Button>
                </div>
              </div>
            </div>

            {/* Keyword Distribution */}
            <div className="border-l pl-6">
              <h4 className="text-sm font-semibold mb-2">
                Keyword Distribution
              </h4>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-sm text-muted-foreground">
                    Total Keywords
                  </div>
                  <div className="text-2xl font-bold">
                    {productInfo.total_keywords}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Organic</div>
                  <div className="text-2xl font-bold text-green-500">
                    {productInfo.organic_keywords}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Paid</div>
                  <div className="text-2xl font-bold text-blue-500">
                    {productInfo.paid_keywords}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    Amazon Rec
                  </div>
                  <div className="text-2xl font-bold text-orange-500">
                    {productInfo.amazon_recommended}
                  </div>
                </div>
              </div>
            </div>

            {/* Amazon Search Vol */}
            <div className="border-l pl-6">
              <h4 className="text-sm font-semibold mb-2">Amazon Search Vol.</h4>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-muted-foreground">
                    Total Search Volume
                  </div>
                  <div className="text-xl font-bold">
                    {productInfo.total_search_volume.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    Average Search Volume
                  </div>
                  <div className="text-xl font-bold">
                    {productInfo.avg_search_volume.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Word Frequency */}
            <div className="border-l pl-6 min-w-[200px]">
              <h4 className="text-sm font-semibold mb-2">Word Frequency</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>olive</span>
                  <span className="font-semibold">(417)</span>
                </div>
                <div className="flex justify-between">
                  <span>leaf</span>
                  <span className="font-semibold">(258)</span>
                </div>
                <div className="flex justify-between">
                  <span>extract</span>
                  <span className="font-semibold">(230)</span>
                </div>
                <div className="flex justify-between">
                  <span>oil</span>
                  <span className="font-semibold">(136)</span>
                </div>
                <div className="flex justify-between">
                  <span>organic</span>
                  <span className="font-semibold">(74)</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keywords Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">
                {filteredKeywords.length} Filtered Keywords
              </h3>
              <Button variant="link" size="sm" className="h-auto p-0">
                <SearchIcon className="h-3 w-3 mr-1" />
                Search
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Translate: None
              </Button>
              <Button variant="outline" size="sm">
                <SettingsIcon className="h-4 w-4 mr-2" />
                Customize
              </Button>
              <Button variant="outline" size="sm">
                <DownloadIcon className="h-4 w-4 mr-2" />
                Export Data...
              </Button>
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">
                    <input type="checkbox" className="rounded" />
                  </TableHead>
                  <TableHead>Keyword Phrase</TableHead>
                  <TableHead>Search Volume</TableHead>
                  <TableHead>Organic Rank</TableHead>
                  <TableHead>Sponsored Rank</TableHead>
                  <TableHead>Competing Products</TableHead>
                  <TableHead>Match Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKeywords.slice(0, 50).map((keyword, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <input type="checkbox" className="rounded" />
                    </TableCell>
                    <TableCell className="font-medium">
                      {keyword.phrase}
                    </TableCell>
                    <TableCell>
                      {keyword.search_volume.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {keyword.organic_rank !== null ? (
                        <Badge
                          variant="outline"
                          className="bg-green-500/10 text-green-500"
                        >
                          #{keyword.organic_rank}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {keyword.sponsored_rank !== null ? (
                        <Badge
                          variant="outline"
                          className="bg-blue-500/10 text-blue-500"
                        >
                          #{keyword.sponsored_rank}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{keyword.competing_products}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {keyword.match_type}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
