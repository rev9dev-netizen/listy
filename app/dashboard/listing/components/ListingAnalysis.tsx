"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { UIKeyword, ListingContent } from "../_types";
import { keywordIsUsed } from "../_utils";

interface Props {
  keywords: UIKeyword[];
  content: ListingContent;
  generatedVolume: number;
}

export function ListingAnalysis({ keywords, content, generatedVolume }: Props) {
  const title = content.title;
  const bullets = [
    content.bullet1,
    content.bullet2,
    content.bullet3,
    content.bullet4,
    content.bullet5,
  ];
  const description = content.description;

  function overallScore() {
    let score = 0;
    if (title) score += 8;
    if (title.length >= 150) score += 7;
    if (description) score += 8;
    if (description.length >= 1000) score += 7;
    const filled = bullets.filter((b) => b.trim()).length;
    score += filled * 4;
    const usedKeywordsCount = keywords.filter((kw) =>
      keywordIsUsed(kw.phrase, content)
    ).length;
    const keywordUtil =
      keywords.length > 0
        ? (usedKeywordsCount / Math.min(keywords.length, 20)) * 25
        : 0;
    score += Math.min(keywordUtil, 25);
    if (title && !/[^\w\s-]/.test(title)) score += 5;
    const words = title.toLowerCase().split(/\s+/);
    const wordCount: Record<string, number> = {};
    for (const w of words)
      if (w.length > 3) wordCount[w] = (wordCount[w] || 0) + 1;
    const hasRepeat = Object.values(wordCount).some((c) => c > 2);
    if (!hasRepeat && title) score += 5;
    if (filled >= 5) score += 5;
    if (bullets.filter(Boolean).every((b) => /^[A-Z]/.test(b)) && bullets[0])
      score += 5;
    if (bullets.every((b) => !b || b.length >= 150)) score += 5;
    return Math.round(score);
  }

  function seoStrength() {
    const used = keywords.filter((kw) => keywordIsUsed(kw.phrase, content));
    const highVol = used.filter((kw) => kw.searchVolume > 5000).length;
    const util =
      keywords.length > 0
        ? (used.length / Math.min(keywords.length, 25)) * 60
        : 0;
    const volumeBonus = highVol * 5;
    const distributionBonus = title && description && bullets[0] ? 20 : 10;
    return Math.min(100, Math.round(util + volumeBonus + distributionBonus));
  }

  function contentRichness() {
    const total =
      title.length +
      description.length +
      bullets.reduce((s, b) => s + b.length, 0);
    return Math.round(Math.min(100, (total / 2500) * 100));
  }

  const overall = overallScore();
  const seo = seoStrength();
  const richness = contentRichness();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Listing Analysis</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 p-4 border rounded-lg bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Overall Listing Score
              </span>
            </div>
            <div className="flex items-end gap-2">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {overall}
              </div>
              <span className="text-lg text-muted-foreground mb-1">/100</span>
            </div>
            <div className="h-3 bg-white/50 dark:bg-black/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                style={{ width: `${overall}%` }}
              />
            </div>
          </div>

          <div className="space-y-2 p-4 border rounded-lg">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold">SEO Strength</span>
            </div>
            <div className="flex items-end gap-2">
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {seo}
              </div>
              <span className="text-base text-muted-foreground mb-1">/100</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {
                keywords.filter((kw) => keywordIsUsed(kw.phrase, content))
                  .length
              }{" "}
              of {keywords.length} keywords indexed
            </div>
          </div>

          <div className="space-y-2 p-4 border rounded-lg">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold">Content Richness</span>
            </div>
            <div className="flex items-end gap-2">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {richness}
              </div>
              <span className="text-base text-muted-foreground mb-1">/100</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {(
                title.length +
                description.length +
                bullets.reduce((s, b) => s + b.length, 0)
              ).toLocaleString()}{" "}
              total characters
            </div>
          </div>

          <div className="space-y-2 p-4 border rounded-lg">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold">
                Conversion Potential
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
      </CardContent>
    </Card>
  );
}
