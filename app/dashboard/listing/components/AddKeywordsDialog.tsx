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

interface Props {
  open: boolean;
  setOpen: (v: boolean) => void;
  bulkText: string;
  setBulkText: (v: string) => void;
  onAdd: (phrases: string[]) => void;
}

export function AddKeywordsDialog({
  open,
  setOpen,
  bulkText,
  setBulkText,
  onAdd,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Keywords Manually</DialogTitle>
          <DialogDescription>
            Enter keyword or phrase (press Enter to add)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder={
              "Enter keywords separated by commas or new lines\nExample: honey, organic honey, raw honey"
            }
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={8}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Press Enter to add, Shift+Enter for new line
          </p>
        </div>
        <DialogFooter>
          <div className="flex gap-2 justify-end w-full">
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                setBulkText("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!bulkText.trim()) return;
                const phrases = bulkText
                  .split(/[\,\n]/)
                  .map((k) => k.trim())
                  .filter((k) => k.length > 0);
                onAdd(phrases);
                setOpen(false);
                setBulkText("");
              }}
              disabled={!bulkText.trim()}
            >
              + Add Keyword
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
