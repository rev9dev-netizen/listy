"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreateAdGroupDialogProps {
  campaignId: string;
  children: React.ReactNode;
}

export default function CreateAdGroupDialog({
  campaignId,
  children,
}: CreateAdGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    defaultBid: "",
    status: "ENABLED",
  });

  const router = useRouter();
  const queryClient = useQueryClient();

  const createAdGroupMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/ppc/ad-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create ad group");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast.success("Ad group created successfully!");
      setOpen(false);
      setFormData({ name: "", defaultBid: "", status: "ENABLED" });
      queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] });
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create ad group");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error("Please enter an ad group name");
      return;
    }

    const bidValue = parseFloat(formData.defaultBid);
    if (isNaN(bidValue) || bidValue <= 0) {
      toast.error("Please enter a valid default bid");
      return;
    }

    if (bidValue > 100) {
      toast.error("Default bid cannot exceed $100");
      return;
    }

    createAdGroupMutation.mutate({
      campaignId,
      name: formData.name,
      defaultBid: bidValue,
      status: formData.status,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Ad Group</DialogTitle>
          <DialogDescription>
            Create a new ad group to organize your keywords and products.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Ad Group Name *</Label>
              <Input
                id="name"
                placeholder="e.g., High Performance Keywords"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                maxLength={128}
                required
              />
              <p className="text-xs text-muted-foreground">
                Choose a descriptive name for your ad group
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="defaultBid">Default Bid (USD) *</Label>
              <Input
                id="defaultBid"
                type="number"
                placeholder="e.g., 0.75"
                step="0.01"
                min="0.01"
                max="100"
                value={formData.defaultBid}
                onChange={(e) =>
                  setFormData({ ...formData, defaultBid: e.target.value })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Default bid for keywords in this ad group ($0.01 - $100)
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENABLED">Enabled</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Set initial status for this ad group
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createAdGroupMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createAdGroupMutation.isPending}>
              {createAdGroupMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Ad Group
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
