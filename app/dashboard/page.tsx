"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusIcon, FolderIcon, KeyIcon, FileTextIcon } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface Project {
  id: string;
  marketplace: string;
  brand: string | null;
  productType: string | null;
  createdAt: string;
}

async function fetchProjects(): Promise<Project[]> {
  const response = await fetch("/api/projects");
  if (!response.ok) throw new Error("Failed to fetch projects");
  const data = await response.json();
  return data.projects || [];
}

export default function DashboardPage() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your Amazon listing projects
          </p>
        </div>
        <Link href="/dashboard/projects/new">
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Projects
            </CardTitle>
            <FolderIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                projects?.length || 0
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Keywords Generated
            </CardTitle>
            <KeyIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Across all projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Listings Created
            </CardTitle>
            <FileTextIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Ready to export</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
          <CardDescription>Your latest Amazon listing projects</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : projects && projects.length > 0 ? (
            <div className="space-y-2">
              {projects.slice(0, 5).map((project) => (
                <Link
                  key={project.id}
                  href={`/dashboard/projects/${project.id}`}
                  className="block rounded-lg border p-4 transition-colors hover:bg-muted"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">
                        {project.brand || "Untitled Project"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {project.productType || "No product type"} •{" "}
                        {project.marketplace}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="mb-4 text-muted-foreground">No projects yet</p>
              <Link href="/dashboard/projects/new">
                <Button variant="outline">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Create Your First Project
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <Link href="/dashboard/keywords">
            <CardHeader>
              <div className="mb-2 rounded-full bg-primary/10 p-3 w-fit">
                <KeyIcon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Generate Keywords</CardTitle>
              <CardDescription>
                Extract keywords from competitor ASINs and seed phrases
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <Link href="/dashboard/listing">
            <CardHeader>
              <div className="mb-2 rounded-full bg-primary/10 p-3 w-fit">
                <FileTextIcon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Build Listing</CardTitle>
              <CardDescription>
                Create AI-powered Amazon listings with smart keyword placement
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <Link href="/dashboard/projects">
            <CardHeader>
              <div className="mb-2 rounded-full bg-primary/10 p-3 w-fit">
                <FolderIcon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>View Projects</CardTitle>
              <CardDescription>
                Manage all your Amazon listing projects in one place
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>
    </div>
  );
}
