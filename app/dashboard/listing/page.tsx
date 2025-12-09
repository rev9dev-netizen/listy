/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ImageOff, MoreVertical } from "lucide-react";
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
  id: string;
  title: string;
  version: number;
  finalized: boolean;
  updatedAt: string;
  asin?: string;
  imageUrl?: string;
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
      const res = await fetch("/api/listing/create");
      if (!res.ok) throw new Error("Failed to load listings");

      const { listings } = await res.json();
      // For demo, add asin and imageUrl if available (mocked)
      const summaries: ListingSummary[] = listings.map((listing: any) => ({
        id: listing.id,
        title: listing.title || "(Untitled Listing)",
        version: listing.version,
        finalized: listing.finalized,
        updatedAt: new Date(listing.updatedAt).toLocaleString(),
        asin: listing.asin || undefined, // add asin if available
        imageUrl: listing.imageUrl || undefined, // add imageUrl if available
      }));
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
          <table
            className="w-full text-sm border-separate border-spacing-0"
            style={{ tableLayout: "auto" }}
          >
            <thead>
              <tr className="bg-muted border-b border-border text-xs text-foreground uppercase">
                <th
                  className="py-2 px-2 text-left font-bold whitespace-nowrap"
                  style={{ width: 32, minWidth: 32, maxWidth: 32 }}
                >
                  <Checkbox aria-label="Select all" className="w-4 h-4" />
                </th>
                <th
                  className="py-2 px-2 text-left font-bold whitespace-nowrap"
                  style={{ width: 56, minWidth: 56, maxWidth: 56 }}
                >
                  Image
                </th>
                <th
                  className="py-2 px-2 text-left font-bold whitespace-nowrap"
                  style={{ width: 48, minWidth: 48, maxWidth: 48 }}
                >
                  Actions
                </th>
                <th
                  className="py-2 px-2 text-left font-bold whitespace-normal"
                  style={{
                    width: 260,
                    minWidth: 180,
                    maxWidth: 320,
                    wordBreak: "break-word",
                  }}
                >
                  Product Title
                </th>
                <th
                  className="py-2 px-2 text-left font-bold whitespace-nowrap"
                  style={{ width: 48, minWidth: 48, maxWidth: 64 }}
                >
                  Version
                </th>
                <th
                  className="py-2 px-2 text-left font-bold whitespace-nowrap"
                  style={{ width: 80, minWidth: 80, maxWidth: 100 }}
                >
                  Status
                </th>
                <th
                  className="py-2 px-2 text-left font-bold whitespace-nowrap"
                  style={{ width: 140, minWidth: 120, maxWidth: 160 }}
                >
                  Last Updated
                </th>
                <th
                  className="py-2 px-2 text-right font-bold whitespace-nowrap"
                  style={{ width: 56, minWidth: 48, maxWidth: 64 }}
                >
                  Edit
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="py-6">
                    <div className="flex gap-2">
                      <Skeleton className="h-4 w-6" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </td>
                </tr>
              )}
              {data && data.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-6 text-center text-muted-foreground"
                  >
                    No listings yet. Click &quot;Add a Listing&quot; to get
                    started!
                  </td>
                </tr>
              )}
              {data &&
                data.map((l, idx) => (
                  <tr
                    key={l.id}
                    className={`border-b border-border transition-colors ${
                      idx % 2 === 0 ? "bg-background" : "bg-muted/30"
                    } hover:bg-primary/5`}
                  >
                    {/* Checkbox */}
                    <td className="py-2 px-2 align-middle whitespace-nowrap">
                      <Checkbox
                        aria-label={`Select listing ${l.title}`}
                        className="w-4 h-4"
                      />
                    </td>
                    {/* Image */}
                    <td className="py-2 px-2 align-middle whitespace-nowrap">
                      {l.imageUrl ? (
                        <img
                          src={l.imageUrl}
                          alt={l.title}
                          className="w-12 h-12 object-cover rounded-md border bg-white"
                        />
                      ) : (
                        <div className="w-12 h-12 flex items-center justify-center rounded-md border bg-muted text-muted-foreground">
                          <ImageOff className="w-6 h-6" />
                        </div>
                      )}
                    </td>
                    {/* 3-dot Dropdown */}
                    <td className="py-2 px-2 align-middle whitespace-nowrap">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem>Duplicate</DropdownMenuItem>
                          <DropdownMenuItem>Link Listing</DropdownMenuItem>
                          <DropdownMenuItem>Export as CSV</DropdownMenuItem>
                          <DropdownMenuItem>View versions</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                    {/* Title + ASIN */}
                    <td
                      className="py-2 px-2 align-middle"
                      style={{ maxWidth: 320, minWidth: 180, width: 260 }}
                    >
                      <div
                        className="font-medium whitespace-normal break-words leading-tight"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          maxWidth: 320,
                        }}
                      >
                        <span
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            wordBreak: "break-word",
                            maxWidth: 320,
                          }}
                        >
                          {l.title || (
                            <span className="text-muted-foreground">
                              (Untitled)
                            </span>
                          )}
                        </span>
                        {l.asin && (
                          <span
                            className="text-xs text-muted-foreground truncate"
                            style={{ maxWidth: 320 }}
                          >
                            {l.asin}
                          </span>
                        )}
                      </div>
                    </td>
                    {/* Version */}
                    <td className="py-2 px-2 align-middle whitespace-nowrap">
                      v{l.version}
                    </td>
                    {/* Status */}
                    <td className="py-2 px-2 align-middle whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          l.finalized
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {l.finalized ? "Finalized" : "Draft"}
                      </span>
                    </td>
                    {/* Last Updated */}
                    <td className="py-2 px-2 align-middle whitespace-nowrap">
                      {l.updatedAt}
                    </td>
                    {/* Edit Button */}
                    <td className="py-2 px-2 align-middle text-right whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          router.push(`/dashboard/listing/builder?id=${l.id}`)
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
                  // Create new listing
                  const res = await fetch("/api/listing/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      marketplace,
                      mode: createMode,
                      asin: createMode === "fetch" ? asin : undefined,
                    }),
                  });

                  if (!res.ok) {
                    const { error } = await res
                      .json()
                      .catch(() => ({ error: "Failed to create listing" }));
                    throw new Error(error);
                  }

                  const { id, asin: importedAsin } = await res.json();

                  // If fetch mode and we have ASIN, we may need to import
                  if (createMode === "fetch" && importedAsin) {
                    // The import is already handled in the create endpoint
                    // Or you can call the import endpoint here if needed
                  }

                  toast.success("Listing created successfully!");
                  setCreateOpen(false);
                  router.push(`/dashboard/listing/builder?id=${id}`);
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
