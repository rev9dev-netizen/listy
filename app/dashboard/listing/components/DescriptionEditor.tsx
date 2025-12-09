"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SparklesIcon, ImageIcon } from "lucide-react";
import { getCharCountColor } from "../_utils";
import { Skeleton } from "@/components/ui/skeleton";
import { HighlightedTextarea } from "./HighlightedTextarea";
import { useState } from "react";
import { APlusContentDialog } from "./APlusContentDialog";

interface Props {
  value: string;
  onChange: (v: string) => void;
  limit: number;
  canGenerate: boolean;
  generate: () => void;
  generating: boolean;
  pendingSuggestion?: string | null;
  applySuggestion?: () => void;
  discardSuggestion?: () => void;
  selectedKeywords?: string[];
  allKeywords?: string[];
}

export function DescriptionEditor({
  value,
  onChange,
  limit,
  canGenerate,
  generate,
  generating,
  pendingSuggestion,
  applySuggestion,
  discardSuggestion,
  selectedKeywords = [],
  allKeywords = [],
}: Props) {
  const [aPlusDialogOpen, setAPlusDialogOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Description</CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => setAPlusDialogOpen(true)}
              >
                <ImageIcon className="h-4 w-4" />
                Create A+ Content
              </Button>
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
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-end">
            <p className={`text-xs ${getCharCountColor(value.length, limit)}`}>
              {value.length}/{limit} characters
            </p>
          </div>
          <HighlightedTextarea
            rows={12}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Start typing content here"
            keywords={selectedKeywords}
            allKeywords={allKeywords}
          />
          {(generating || pendingSuggestion) && (
            <div className="mt-2">
              {generating && <Skeleton className="h-10 w-full" />}
              {pendingSuggestion && (
                <div className="bg-muted p-2 rounded mt-2">
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

      <APlusContentDialog 
        open={aPlusDialogOpen} 
        onOpenChange={setAPlusDialogOpen}
      />
    </>
  );
}
