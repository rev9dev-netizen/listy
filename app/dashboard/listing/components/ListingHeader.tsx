"use client";
import { Button } from "@/components/ui/button";
import { CheckCircle2Icon, Loader2, Save } from "lucide-react";

type Props = {
  saving?: boolean;
  lastSavedAt?: Date | null;
  onFinish?: () => void;
  finishing?: boolean;
};

export function ListingHeader({
  saving,
  lastSavedAt,
  onFinish,
  finishing,
}: Props) {
  const savedLabel = saving
    ? "Saving…"
    : lastSavedAt
    ? `Saved ${lastSavedAt.toLocaleTimeString()}`
    : "Saved";
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Listing Builder</h1>
        <p className="text-muted-foreground">
          Upload Cerebro keywords and build optimized Amazon listings with AI
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2Icon className="mr-2 h-4 w-4" />
          )}
          {savedLabel}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onFinish}
          disabled={finishing}
        >
          <Save className="mr-2 h-4 w-4" />
          {finishing ? "Finishing…" : "Finish"}
        </Button>
        <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
          Sync to Amazon
        </Button>
      </div>
    </div>
  );
}
