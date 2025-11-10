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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2Icon,
  SparklesIcon,
  CheckCircle2Icon,
  SearchIcon,
  PlusIcon,
  WandIcon,
} from "lucide-react";
import { toast } from "sonner";

interface Keyword {
  phrase: string;
  searchVolume: number;
  selected: boolean;
}

export default function ListingBuilderPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState("keywords");

  // Keywords state
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [manualKeyword, setManualKeyword] = useState("");
  const [sortBy, setSortBy] = useState<"volume" | "alpha">("volume");

  // AI Parameters state
  const [showBrandName, setShowBrandName] = useState("beginning");
  const [productName, setProductName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [tone, setTone] = useState("formal");
  const [targetAudience, setTargetAudience] = useState("");
  const [avoidWords, setAvoidWords] = useState("");
  const [productCharacteristics, setProductCharacteristics] = useState("");

  // Listing state
  const [title, setTitle] = useState("");
  const [bullet1, setBullet1] = useState("");
  const [bullet2, setBullet2] = useState("");
  const [bullet3, setBullet3] = useState("");
  const [bullet4, setBullet4] = useState("");
  const [bullet5, setBullet5] = useState("");
  const [description, setDescription] = useState("");

  // Score state
  const [generatedVolume, setGeneratedVolume] = useState(0);
  const [listingScore, setListingScore] = useState("Not Generated");

  const titleLimit = 200;
  const bulletLimit = 200;
  const descLimit = 2000;

  // Find keywords using AI
  const findKeywordsMutation = useMutation({
    mutationFn: async () => {
      return new Promise<Keyword[]>((resolve) => {
        setTimeout(() => {
          const mockKeywords: Keyword[] = [
            { phrase: "therapy putty", searchVolume: 11854, selected: false },
            {
              phrase: "hand therapy putty",
              searchVolume: 10435,
              selected: false,
            },
            {
              phrase: "therapy putty for hands",
              searchVolume: 9435,
              selected: false,
            },
            {
              phrase: "hand strengthening putty",
              searchVolume: 9000,
              selected: false,
            },
            {
              phrase: "physical therapy putty",
              searchVolume: 5435,
              selected: false,
            },
            {
              phrase: "finger strengthening tools",
              searchVolume: 5000,
              selected: false,
            },
            {
              phrase: "occupational therapy putty",
              searchVolume: 900,
              selected: false,
            },
          ];
          resolve(mockKeywords);
        }, 1500);
      });
    },
    onSuccess: (data) => {
      setKeywords(data);
      toast.success(`Found ${data.length} keywords!`);
    },
    onError: () => {
      toast.error("Failed to find keywords");
    },
  });

  // Generate content for a specific section
  const generateContentMutation = useMutation({
    mutationFn: async (section: "title" | "bullets" | "description") => {
      const selectedKeywords = keywords
        .filter((k) => k.selected)
        .map((k) => k.phrase);

      if (selectedKeywords.length === 0) {
        throw new Error("Please select keywords first");
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
          section,
          showBrandName,
          targetAudience,
          avoidWords: avoidWords
            .split(",")
            .map((w) => w.trim())
            .filter(Boolean),
        }),
      });

      if (!response.ok) throw new Error("Failed to generate content");
      return response.json();
    },
    onSuccess: (data, section) => {
      if (section === "title") {
        setTitle(data.title);
      } else if (section === "bullets") {
        setBullet1(data.bullets[0] || "");
        setBullet2(data.bullets[1] || "");
        setBullet3(data.bullets[2] || "");
        setBullet4(data.bullets[3] || "");
        setBullet5(data.bullets[4] || "");
      } else if (section === "description") {
        setDescription(data.description);
      }

      toast.success(
        `${
          section === "title"
            ? "Title"
            : section === "bullets"
            ? "Features"
            : "Description"
        } generated!`
      );
      updateScore();
    },
    onError: () => {
      toast.error("Failed to generate content");
    },
  });

  // Add manual keyword
  const handleAddKeyword = () => {
    if (!manualKeyword.trim()) return;

    const newKeyword: Keyword = {
      phrase: manualKeyword.trim(),
      searchVolume: 0,
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

  const sortedKeywords = [...keywords].sort((a, b) => {
    if (sortBy === "volume") return b.searchVolume - a.searchVolume;
    return a.phrase.localeCompare(b.phrase);
  });

  const selectedCount = keywords.filter((k) => k.selected).length;

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="border-b">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="keywords" className="gap-2">
                <CheckCircle2Icon className="h-4 w-4" />
                Select Keywords
              </TabsTrigger>
              <TabsTrigger value="editor" className="gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs text-white">
                  2
                </span>
                Content Editor
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2 pb-2">
              <Button variant="outline" size="sm">
                <CheckCircle2Icon className="mr-2 h-4 w-4" />
                Saved
              </Button>
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                Sync to Amazon
              </Button>
            </div>
          </div>

          {/* Tab 1: Select Keywords */}
          <TabsContent value="keywords" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  Create a bank of keywords for your listing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Find Keywords with AI */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                      <SearchIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        Find Keywords using AI + Amazon
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Enter product characteristics and let AI find relevant
                        keywords
                      </p>
                    </div>
                    <Button
                      onClick={() => findKeywordsMutation.mutate()}
                      disabled={findKeywordsMutation.isPending}
                    >
                      {findKeywordsMutation.isPending ? (
                        <>
                          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                          Finding...
                        </>
                      ) : (
                        <>
                          <SearchIcon className="mr-2 h-4 w-4" />
                          Find Keywords
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Product Characteristics *</Label>
                    <Textarea
                      placeholder="e.g., Blue, 5G, Durable and sleek design, night mode, etc"
                      value={productCharacteristics}
                      onChange={(e) =>
                        setProductCharacteristics(e.target.value)
                      }
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      0/1500 characters
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Manually Add Keywords */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                      <PlusIcon className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Manually Add Keywords</h3>
                      <p className="text-sm text-muted-foreground">
                        Add your own keywords to the bank
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter keyword or phrase"
                      value={manualKeyword}
                      onChange={(e) => setManualKeyword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddKeyword();
                        }
                      }}
                    />
                    <Button
                      onClick={handleAddKeyword}
                      disabled={!manualKeyword.trim()}
                    >
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Add
                    </Button>
                  </div>
                </div>

                {/* Keywords List */}
                {keywords.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">
                          Your Keywords ({selectedCount} selected)
                        </h3>
                        <Select
                          value={sortBy}
                          onValueChange={(v) =>
                            setSortBy(v as "volume" | "alpha")
                          }
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="volume">
                              Sort by: Search volume (high to low)
                            </SelectItem>
                            <SelectItem value="alpha">
                              Sort by: Alphabetical
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        {sortedKeywords.map((kw, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"
                          >
                            <Checkbox
                              checked={kw.selected}
                              onCheckedChange={() => toggleKeyword(kw.phrase)}
                            />
                            <div className="flex-1">
                              <p className="font-medium">{kw.phrase}</p>
                              {kw.searchVolume > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  {kw.searchVolume.toLocaleString()} monthly
                                  searches
                                </p>
                              )}
                            </div>
                            {kw.searchVolume > 0 && (
                              <Badge variant="secondary">
                                {kw.searchVolume.toLocaleString()}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>

                      <Button
                        onClick={() => setActiveTab("editor")}
                        className="w-full"
                        disabled={selectedCount === 0}
                      >
                        Continue to Content Editor ({selectedCount} keywords
                        selected)
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Content Editor */}
          <TabsContent value="editor" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-[280px_1fr_320px]">
              {/* Left: Keywords/Phrases */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Keywords / Phrases
                  </CardTitle>
                  <Select
                    value={sortBy}
                    onValueChange={(v) => setSortBy(v as "volume" | "alpha")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="volume">
                        Search volume (high to low)
                      </SelectItem>
                      <SelectItem value="alpha">Alphabetical</SelectItem>
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent className="space-y-2">
                  {sortedKeywords
                    .filter((k) => k.selected)
                    .map((kw, index) => {
                      const allText =
                        `${title} ${bullet1} ${bullet2} ${bullet3} ${bullet4} ${bullet5} ${description}`.toLowerCase();
                      const isUsed = allText.includes(kw.phrase.toLowerCase());

                      return (
                        <div
                          key={index}
                          className={`space-y-1 rounded border p-2 text-sm ${
                            isUsed
                              ? "border-green-500/50 bg-green-50"
                              : "border-border"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-medium">{kw.phrase}</span>
                            {isUsed && (
                              <CheckCircle2Icon className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                          {kw.searchVolume > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {kw.searchVolume.toLocaleString()}
                            </p>
                          )}
                        </div>
                      );
                    })}
                </CardContent>
              </Card>

              {/* Center: Content Editor */}
              <div className="space-y-6">
                {/* AI Parameters */}
                <Card className="bg-blue-50/50">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <SparklesIcon className="h-5 w-5 text-blue-600" />
                      Build your listing with AI
                    </CardTitle>
                    <CardDescription>
                      Enter product characteristics, add your keywords, and
                      automatically generate copy
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Product Characteristics *</Label>
                      <Textarea
                        placeholder="e.g., Blue, 5G, Durable and sleek design, night mode, etc"
                        value={productCharacteristics}
                        onChange={(e) =>
                          setProductCharacteristics(e.target.value)
                        }
                        rows={2}
                      />
                      <p className="text-xs text-muted-foreground">
                        0/1500 characters
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Brand Name</Label>
                        <Input
                          placeholder="Optional"
                          value={brandName}
                          onChange={(e) => setBrandName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Show Brand Name</Label>
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
                        <Label>Product Name</Label>
                        <Input
                          placeholder="e.g., iPhone 14 Pro"
                          value={productName}
                          onChange={(e) => setProductName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tone</Label>
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
                      <Label>Target Audience</Label>
                      <Textarea
                        placeholder="Enter attributes separated by commas"
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        rows={2}
                      />
                      <p className="text-xs text-muted-foreground">0/100</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Words & Special Characters to Avoid</Label>
                      <Textarea
                        placeholder="Enter words & characters separated by commas"
                        value={avoidWords}
                        onChange={(e) => setAvoidWords(e.target.value)}
                        rows={2}
                      />
                      <p className="text-xs text-muted-foreground">0/100</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Product Title */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Product Title</CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={() => generateContentMutation.mutate("title")}
                        disabled={
                          generateContentMutation.isPending ||
                          selectedCount === 0
                        }
                      >
                        <SparklesIcon className="h-4 w-4" />
                        {generateContentMutation.isPending
                          ? "Generating..."
                          : "AI Assist"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        AB
                      </Button>
                      <Button variant="outline" size="sm">
                        Ab
                      </Button>
                      <Button variant="outline" size="sm">
                        ab
                      </Button>
                    </div>
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
                      <span
                        className={getCharCountColor(title.length, titleLimit)}
                      >
                        {title.length}/{titleLimit} characters
                      </span>
                      <span className="text-muted-foreground">
                        Used keywords:{" "}
                        {
                          keywords.filter(
                            (k) =>
                              k.selected &&
                              title
                                .toLowerCase()
                                .includes(k.phrase.toLowerCase())
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
                      <CardTitle className="text-base">Features</CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={() =>
                          generateContentMutation.mutate("bullets")
                        }
                        disabled={
                          generateContentMutation.isPending ||
                          selectedCount === 0
                        }
                      >
                        <SparklesIcon className="h-4 w-4" />
                        {generateContentMutation.isPending
                          ? "Generating..."
                          : "AI Assist"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      {
                        value: bullet1,
                        setter: setBullet1,
                        label: "Feature #1",
                      },
                      {
                        value: bullet2,
                        setter: setBullet2,
                        label: "Feature #2",
                      },
                      {
                        value: bullet3,
                        setter: setBullet3,
                        label: "Feature #3",
                      },
                      {
                        value: bullet4,
                        setter: setBullet4,
                        label: "Feature #4",
                      },
                      {
                        value: bullet5,
                        setter: setBullet5,
                        label: "Feature #5",
                      },
                    ].map((bullet, index) => (
                      <div key={index} className="space-y-2">
                        <Label>{bullet.label}</Label>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            AB
                          </Button>
                          <Button variant="outline" size="sm">
                            Ab
                          </Button>
                          <Button variant="outline" size="sm">
                            ab
                          </Button>
                        </div>
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
                          generateContentMutation.mutate("description")
                        }
                        disabled={
                          generateContentMutation.isPending ||
                          selectedCount === 0
                        }
                      >
                        <SparklesIcon className="h-4 w-4" />
                        {generateContentMutation.isPending
                          ? "Generating..."
                          : "AI Assist"}
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

              {/* Right: AI Score & Details */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Generated Search Volume
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {(generatedVolume / 1000).toFixed(1)}M
                    </div>
                    <p className="text-sm text-muted-foreground">/3M</p>
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
                          <div className="h-2 w-4/5 rounded-full bg-green-500"></div>
                        </div>
                      </div>
                      <p className="font-semibold text-green-600">
                        {listingScore}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Score Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      {
                        label: "Product Title",
                        value: `Between 80 - 150 characters`,
                        chars: title.length,
                        status:
                          title.length >= 80 && title.length <= 200
                            ? "success"
                            : title.length > 0
                            ? "warning"
                            : "pending",
                      },
                      {
                        label: "Product Features",
                        value: `Minimum 5 features`,
                        chars: [
                          bullet1,
                          bullet2,
                          bullet3,
                          bullet4,
                          bullet5,
                        ].filter(Boolean).length,
                        status:
                          [bullet1, bullet2, bullet3, bullet4, bullet5].filter(
                            Boolean
                          ).length >= 5
                            ? "success"
                            : [
                                bullet1,
                                bullet2,
                                bullet3,
                                bullet4,
                                bullet5,
                              ].filter(Boolean).length > 0
                            ? "warning"
                            : "pending",
                      },
                      {
                        label: "Description",
                        value: `1000-2000 characters`,
                        chars: description.length,
                        status:
                          description.length >= 1000 &&
                          description.length <= 2000
                            ? "success"
                            : description.length > 0
                            ? "warning"
                            : "pending",
                      },
                      {
                        label: "Keywords Used",
                        value: `Minimum 70% of top and good performing keywords used`,
                        percent:
                          selectedCount > 0
                            ? Math.round(
                                (keywords.filter((k) => {
                                  const allText =
                                    `${title} ${bullet1} ${bullet2} ${bullet3} ${bullet4} ${bullet5} ${description}`.toLowerCase();
                                  return (
                                    k.selected &&
                                    allText.includes(k.phrase.toLowerCase())
                                  );
                                }).length /
                                  selectedCount) *
                                  100
                              )
                            : 0,
                        status:
                          selectedCount > 0 &&
                          keywords.filter((k) => {
                            const allText =
                              `${title} ${bullet1} ${bullet2} ${bullet3} ${bullet4} ${bullet5} ${description}`.toLowerCase();
                            return (
                              k.selected &&
                              allText.includes(k.phrase.toLowerCase())
                            );
                          }).length /
                            selectedCount >=
                            0.7
                            ? "success"
                            : "warning",
                      },
                    ].map((item, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {item.label}
                          </span>
                          {item.status === "success" ? (
                            <CheckCircle2Icon className="h-4 w-4 text-green-600" />
                          ) : item.status === "warning" ? (
                            <WandIcon className="h-4 w-4 text-yellow-600" />
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              -
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.value}
                        </p>
                        {"chars" in item && (
                          <p className="text-xs font-medium">{item.chars}</p>
                        )}
                        {"percent" in item && (
                          <p className="text-xs font-medium">{item.percent}%</p>
                        )}
                      </div>
                    ))}

                    <Separator />

                    <div className="space-y-1">
                      <span className="text-sm font-medium">
                        Backend Search Terms
                      </span>
                      <p className="text-xs text-muted-foreground">
                        200-249 characters
                      </p>
                      <p className="text-xs text-muted-foreground">-</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-sm font-medium">
                        Product Images
                      </span>
                      <p className="text-xs text-muted-foreground">
                        7-9 Images
                      </p>
                      <p className="text-xs text-muted-foreground">
                        High resolution images (smales side min. 1000px)
                      </p>
                      <p className="text-xs text-muted-foreground">-</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
