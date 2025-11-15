"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SparklesIcon } from "lucide-react";
import { getCharCountColor } from "../_utils";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  bullets: string[];
  onChange: (index: number, value: string) => void;
  limit: number;
  canGenerate: boolean;
  generate: () => void;
  generating: boolean;
  pendingSuggestion?: string | null;
  applySuggestion?: () => void;
  discardSuggestion?: () => void;
}

export function BulletsEditor({
  bullets,
  onChange,
  limit,
  canGenerate,
  generate,
  generating,
  pendingSuggestion,
  applySuggestion,
  discardSuggestion,
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
            <Textarea
              rows={2}
              value={value}
              onChange={(e) => onChange(index, e.target.value)}
              placeholder="Start typing content here"
            />
            {/* Show skeleton under each bullet when generating */}
            {generating && <Skeleton className="h-10 w-full mt-2" />}
          </div>
        ))}
        {/* Suggestion box, only if pendingSuggestion exists */}
        {pendingSuggestion && (
          <div className="bg-muted p-2 rounded mt-2">
            <div>{pendingSuggestion}</div>
            <div className="flex gap-2 mt-2 justify-end">
              <Button size="sm" onClick={applySuggestion}>
                Use suggestion
              </Button>
              <Button size="sm" variant="outline" onClick={discardSuggestion}>
                Discard
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
