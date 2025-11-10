"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  setOpen: (v: boolean) => void;
  loading: boolean;
  suggestion: string | null;
  onApply: () => void;
  onRegenerate: () => void;
}

export function AISuggestionDialog({
  open,
  setOpen,
  loading,
  suggestion,
  onApply,
  onRegenerate,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>AI Suggestion</DialogTitle>
          <DialogDescription>
            Review and apply or regenerate the AI generated content
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Generating
              suggestion...
            </div>
          ) : (
            <Textarea
              value={suggestion ?? ""}
              readOnly
              rows={12}
              className="resize-none"
            />
          )}
        </div>
        <DialogFooter>
          <div className="flex gap-2 justify-end w-full">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button
              variant="secondary"
              onClick={onRegenerate}
              disabled={loading}
            >
              Regenerate
            </Button>
            <Button
              onClick={() => {
                onApply();
                setOpen(false);
              }}
              disabled={loading || !suggestion}
            >
              Apply
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
