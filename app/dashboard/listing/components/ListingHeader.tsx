"use client";
import { Button } from "@/components/ui/button";
import { CheckCircle2Icon } from "lucide-react";

export function ListingHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Listing Builder</h1>
        <p className="text-muted-foreground">
          Upload Cerebro keywords and build optimized Amazon listings with AI
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <CheckCircle2Icon className="mr-2 h-4 w-4" />
          Saved
        </Button>
        <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
          Sync to Amazon
        </Button>
      </div>
    </div>
  );
}
