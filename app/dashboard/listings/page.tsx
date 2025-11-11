"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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

  useEffect(() => {
    async function load() {
      try {
        const projectsRes = await fetch("/api/projects");
        const pj = await projectsRes.json();
        const summaries: ListingSummary[] = [];
        for (const p of pj.projects || []) {
          const draftRes = await fetch(`/api/listing/draft?projectId=${p.id}`);
          let title = "";
          let version = 0;
          if (draftRes.ok) {
            const d = await draftRes.json();
            title = d.title || "";
            version = d.version || 0;
          }
          summaries.push({
            projectId: p.id,
            title,
            version,
            marketplace: p.marketplace || "US",
            updatedAt: new Date(p.updatedAt).toLocaleString(),
          });
        }
        setData(summaries);
      } catch (e) {
        console.error("Failed to load listings dashboard", e);
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Listing Builder</h1>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/listing">Add a Listing</Link>
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
                            `/dashboard/listing?projectId=${l.projectId}`
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
    </div>
  );
}
