"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ListingSummary {
  projectId: string;
  title: string;
  version: number;
  marketplace: string;
  updatedAt: string;
}

export default function ListingsDashboardPage() {
  const [data, setData] = useState<ListingSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [marketplace, setMarketplace] = useState("US");
  const [createMode, setCreateMode] = useState<"scratch" | "fetch">("scratch");
  const [asin, setAsin] = useState("");

  const load = useCallback(async () => {
    try {
      const projectsRes = await fetch("/api/projects");
      const pj = await projectsRes.json();
      const summaries: ListingSummary[] = [];
      for (const p of pj.projects || []) {
        const draftRes = await fetch(`/api/listing/draft?projectId=${p.id}`);
        let title = "";
        let version = 0;
        let updatedAt = p.updatedAt;
        if (draftRes.ok) {
          const d = await draftRes.json();
          title = d.title || "";
          version = d.version || 0;
          updatedAt = d.updatedAt || p.updatedAt;
        }
        summaries.push({
          projectId: p.id,
          title,
          version,
          marketplace: p.marketplace || "US",
          updatedAt: new Date(updatedAt).toLocaleString(),
        });
      }
      setData(summaries);
    } catch (e) {
      console.error("Failed to load listings dashboard", e);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Listing Builder</h1>
        <div className="flex gap-2">
          <Button onClick={() => setCreateOpen(true)}>Add a Listing</Button>
          <Button
            variant="outline"
            onClick={() => {
              setLoading(true);
              load();
            }}
          >
            Refresh
          </Button>
        </div>
      </div>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-muted-foreground">
            {data ? `${data.length} Listings` : "Listings"}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="py-2 text-left font-medium">Title</th>
                <th className="py-2 text-left font-medium">Marketplace</th>
                <th className="py-2 text-left font-medium">Version</th>
                <th className="py-2 text-left font-medium">Last Updated</th>
                <th className="py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="py-6">
                    <div className="flex gap-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </td>
                </tr>
              )}
              {data && data.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-6 text-center text-muted-foreground"
                  >
                    No listings yet.
                  </td>
                </tr>
              )}
              {data &&
                data.map((l) => (
                  <tr key={l.projectId} className="border-b hover:bg-muted/50">
                    <td className="py-2 max-w-xs truncate">
                      {l.title || (
                        <span className="text-muted-foreground">
                          (Untitled)
                        </span>
                      )}
                    </td>
                    <td className="py-2">{l.marketplace}</td>
                    <td className="py-2">{l.version}</td>
                    <td className="py-2">{l.updatedAt}</td>
                    <td className="py-2 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          router.push(
                            `/dashboard/listing/builder?projectId=${l.projectId}`
                          )
                        }
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Listing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Mode cards */}
            <div className="grid gap-3 md:grid-cols-2">
              <Card
                className={`p-4 cursor-pointer border ${
                  createMode === "scratch"
                    ? "border-primary ring-2 ring-primary/20"
                    : ""
                }`}
                onClick={() => setCreateMode("scratch")}
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-primary/10 p-2">
                    {/* icon */}
                    <span className="block h-5 w-5">📝</span>
                  </div>
                  <div>
                    <div className="font-medium">Create from scratch</div>
                    <div className="text-sm text-muted-foreground">
                      Start with a blank listing and add content and keywords.
                    </div>
                  </div>
                </div>
              </Card>
              <Card
                className={`p-4 cursor-pointer border ${
                  createMode === "fetch"
                    ? "border-primary ring-2 ring-primary/20"
                    : ""
                }`}
                onClick={() => setCreateMode("fetch")}
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-primary/10 p-2">
                    {/* icon */}
                    <span className="block h-5 w-5">🛒</span>
                  </div>
                  <div>
                    <div className="font-medium">Fetch from Amazon</div>
                    <div className="text-sm text-muted-foreground">
                      Import an existing listing by ASIN, then optimize it.
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Inputs */}
            <div className="space-y-1">
              <Label htmlFor="marketplace">Marketplace</Label>
              <Input
                id="marketplace"
                value={marketplace}
                onChange={(e) => setMarketplace(e.target.value.toUpperCase())}
                placeholder="US"
              />
            </div>
            {createMode === "fetch" && (
              <div className="space-y-1">
                <Label htmlFor="asin">ASIN</Label>
                <Input
                  id="asin"
                  value={asin}
                  onChange={(e) => setAsin(e.target.value.toUpperCase().trim())}
                  placeholder="e.g. B0ABCDE123"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                setCreating(true);
                try {
                  const res = await fetch("/api/projects", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ marketplace }),
                  });
                  if (!res.ok) throw new Error("Failed to create project");
                  const pj = await res.json();

                  // If fetch mode, import initial content from Amazon using ASIN
                  if (createMode === "fetch") {
                    if (!asin) throw new Error("Please provide an ASIN");
                    const importRes = await fetch("/api/listing/import", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        projectId: pj.id,
                        asin,
                        marketplace,
                      }),
                    });
                    if (!importRes.ok) {
                      const { error } = await importRes
                        .json()
                        .catch(() => ({ error: "Import failed" }));
                      throw new Error(error || "Failed to import listing");
                    }
                  }
                  toast.success("Listing created");
                  setCreateOpen(false);
                  router.push(`/dashboard/listing/builder?projectId=${pj.id}`);
                } catch (e) {
                  const msg = e instanceof Error ? e.message : "Create failed";
                  toast.error(msg);
                } finally {
                  setCreating(false);
                }
              }}
              disabled={
                creating ||
                !marketplace.trim() ||
                (createMode === "fetch" && asin.trim().length === 0)
              }
            >
              {creating
                ? "Creating..."
                : createMode === "fetch"
                ? "Start Optimizing"
                : "Get Started"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
