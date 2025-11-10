"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SparklesIcon } from "lucide-react";
import { getCharCountColor } from "../_utils";

interface Props {
  bullets: string[];
  onChange: (index: number, value: string) => void;
  limit: number;
  canGenerate: boolean;
  generate: () => void;
  generating: boolean;
}

export function BulletsEditor({
  bullets,
  onChange,
  limit,
  canGenerate,
  generate,
  generating,
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
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
