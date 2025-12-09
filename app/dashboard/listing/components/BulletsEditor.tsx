"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SparklesIcon } from "lucide-react";
import { getCharCountColor } from "../_utils";
import { Skeleton } from "@/components/ui/skeleton";
import { HighlightedTextarea } from "./HighlightedTextarea";

interface Props {
  bullets: string[];
  onChange: (index: number, value: string) => void;
  limit: number;
  canGenerate: boolean;
  generate: () => void;
  generating: boolean;
  bulletSuggestions?: (string | null)[];
  applySuggestion?: (bulletIndex: number) => void;
  discardSuggestion?: (bulletIndex: number) => void;
  selectedKeywords?: string[];
  allKeywords?: string[];
}

export function BulletsEditor({
  bullets,
  onChange,
  limit,
  canGenerate,
  generate,
  generating,
  bulletSuggestions = [null, null, null, null, null],
  applySuggestion,
  discardSuggestion,
  selectedKeywords = [],
  allKeywords = [],
}: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Features (Bullet Points)</CardTitle>
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
      <CardContent className="space-y-4">
        {bullets.map((value, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{`Feature #${index + 1}`}</Label>
              <p
                className={`text-xs ${getCharCountColor(value.length, limit)}`}
              >
                {value.length}/{limit} characters
              </p>
            </div>
            <HighlightedTextarea
              rows={2}
              value={value}
              onChange={(e) => onChange(index, e.target.value)}
              placeholder="Start typing content here"
              keywords={selectedKeywords}
              allKeywords={allKeywords}
            />
            {/* Show skeleton when generating */}
            {generating && <Skeleton className="h-10 w-full mt-2" />}
            {/* Show suggestion for this specific bullet */}
            {bulletSuggestions[index] && (
              <div className="bg-muted p-3 rounded mt-2">
                <div className="text-sm">{bulletSuggestions[index]}</div>
                <div className="flex gap-2 mt-2 justify-end">
                  <Button
                    size="sm"
                    onClick={() => applySuggestion && applySuggestion(index)}
                  >
                    Use suggestion
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => discardSuggestion && discardSuggestion(index)}
                  >
                    Discard
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
