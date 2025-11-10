"use client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon } from "lucide-react";
import type { UIKeyword, ListingContent } from "../_types";
import { keywordIsUsed } from "../_utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keywords: UIKeyword[];
  filter: "1" | "2" | "3+";
  setFilter: (v: "1" | "2" | "3+") => void;
  onToggleKeyword: (phrase: string) => void;
  content: ListingContent;
}

export function RootKeywords({
  open,
  onOpenChange,
  keywords,
  filter,
  setFilter,
  onToggleKeyword,
  content,
}: Props) {
  const rootFiltered = keywords.filter((k) => {
    const count = k.phrase.trim().split(/\s+/).length;
    if (filter === "1") return count === 1;
    if (filter === "2") return count === 2;
    return count >= 3;
  });
  const sorted = [...rootFiltered].sort(
    (a, b) => b.searchVolume - a.searchVolume
  );

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <Card>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="space-y-1 text-left">
                <CardTitle className="text-base">
                  Root Keywords ({rootFiltered.length})
                </CardTitle>
                <CardDescription>
                  {open
                    ? "Sorted by phrase frequency"
                    : `${
                        filter === "1"
                          ? "1 word phrases"
                          : filter === "2"
                          ? "2 word phrases"
                          : "3+ word phrases"
                      } - Click to expand`}
                </CardDescription>
              </div>
              <ChevronDownIcon
                className={`h-5 w-5 transition-transform ${
                  open ? "rotate-180" : ""
                }`}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            <div className="text-xs text-muted-foreground">
              Alone, base keywords are not that useful but understanding which
              keyword phrases include the most base keywords.
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant={filter === "1" ? "default" : "outline"}
                onClick={() => setFilter("1")}
                className="text-xs"
              >
                1 Word Roots
              </Button>
              <Button
                size="sm"
                variant={filter === "2" ? "default" : "outline"}
                onClick={() => setFilter("2")}
                className="text-xs"
              >
                2 Word Roots
              </Button>
              <Button
                size="sm"
                variant={filter === "3+" ? "default" : "outline"}
                onClick={() => setFilter("3+")}
                className="text-xs"
              >
                3+ Word Roots
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {sorted.map((kw, i) => {
                const usedCount = keywordIsUsed(kw.phrase, content);
                return (
                  <button
                    key={i}
                    onClick={() => onToggleKeyword(kw.phrase)}
                    className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                      kw.selected
                        ? "bg-blue-500 text-white border-blue-600"
                        : "bg-background hover:bg-muted border-border"
                    } ${usedCount > 0 ? "ring-2 ring-green-500/50" : ""}`}
                  >
                    <span
                      className={`font-medium ${
                        usedCount > 0 ? "line-through" : ""
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
}
