"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SparklesIcon } from "lucide-react";
import { getCharCountColor } from "../_utils";
import { Skeleton } from "@/components/ui/skeleton";
import { HighlightedTextarea } from "./HighlightedTextarea";

interface Props {
  value: string;
  onChange: (v: string) => void;
  limit: number;
  keywordsUsed: number;
  canGenerate: boolean;
  generate: () => void;
  generating: boolean;
  pendingSuggestion?: string | null;
  applySuggestion?: () => void;
  discardSuggestion?: () => void;
  selectedKeywords?: string[];
  allKeywords?: string[];
}

export function TitleEditor({
  value,
  onChange,
  limit,
  keywordsUsed,
  canGenerate,
  generate,
  generating,
  pendingSuggestion,
  applySuggestion,
  discardSuggestion,
  selectedKeywords = [],
  allKeywords = [],
}: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Product Title</CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={generate}
            disabled={generating || !canGenerate}
          >
            <SparklesIcon className="h-4 w-4" />
            {generating ? "Generating..." : "Write with AI"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-muted-foreground">
            Keywords used: {keywordsUsed}
          </span>
          <span className={getCharCountColor(value.length, limit)}>
            {value.length}/{limit} characters
          </span>
        </div>
        <HighlightedTextarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Start typing content here"
          keywords={selectedKeywords}
          allKeywords={allKeywords}
        />
        {/* Inline AI suggestion UI: show skeleton and suggestion until applied/discarded */}
        {(generating || pendingSuggestion) && (
          <div className="mt-2">
            {generating && <Skeleton className="h-10 w-full" />}
            {pendingSuggestion && (
              <div className="bg-muted p-2 rounded mt-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <SparklesIcon className="h-3 w-3" />
                    Powered by AI
                  </span>
                </div>
                <div>{pendingSuggestion}</div>
                <div className="flex gap-2 mt-2 justify-end">
                  <Button size="sm" onClick={applySuggestion}>
                    Use suggestion
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={discardSuggestion}
                  >
                    Discard
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
