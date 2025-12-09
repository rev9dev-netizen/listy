"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function SearchTermsEditor({ value, onChange }: Props) {
  // Amazon backend search terms limit is 249 bytes
  const byteCount = new Blob([value]).size;
  const byteLimit = 249;
  const isOverLimit = byteCount > byteLimit;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Backend Search Terms</CardTitle>
          <p
            className={`text-xs ${
              isOverLimit
                ? "text-red-500 font-medium"
                : byteCount > byteLimit * 0.9
                ? "text-yellow-500"
                : "text-muted-foreground"
            }`}
          >
            {byteCount}/{byteLimit} bytes
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Add keywords not already in your listing. Separate with spaces. No commas, no duplicates."
          className={isOverLimit ? "border-red-500 focus-visible:ring-red-500" : ""}
        />
        {isOverLimit && (
          <p className="text-xs text-red-500">
            Exceeds Amazon&apos;s 249 byte limit. Remove some keywords.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
