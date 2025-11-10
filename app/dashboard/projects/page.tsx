"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Loader2Icon,
  PlusIcon,
  FolderIcon,
  LayoutGridIcon,
  LayoutListIcon,
  SparklesIcon,
  FileTextIcon,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  marketplace: string;
  category: string;
  status: string;
  createdAt: string;
  _count?: {
    keywords: number;
    drafts: number;
  };
}

export default function ProjectsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // New project form
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectMarketplace, setNewProjectMarketplace] = useState("US");
  const [newProjectCategory, setNewProjectCategory] = useState("");

  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      marketplace: string;
      category: string;
    }) => {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create project");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setCreateDialogOpen(false);
      setNewProjectName("");
      setNewProjectCategory("");
      toast.success("Project created successfully!");
    },
    onError: () => {
      toast.error("Failed to create project");
    },
  });

  const handleCreateProject = () => {
    if (!newProjectName || !newProjectCategory) {
      toast.error("Please enter project name and category");
      return;
    }

    createMutation.mutate({
      name: newProjectName,
      marketplace: newProjectMarketplace,
      category: newProjectCategory,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-500";
      case "draft":
        return "bg-yellow-500/10 text-yellow-500";
      case "completed":
        return "bg-blue-500/10 text-blue-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Manage your Amazon listing projects
          </p>
        </div>
        <div className="flex gap-2">
          {/* View Toggle */}
          <div className="flex rounded-lg border">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGridIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <LayoutListIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Create Project Dialog */}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Start a new Amazon listing project
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name *</Label>
                  <Input
                    id="projectName"
                    placeholder="e.g., Voltix Wireless Charger"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marketplace">Marketplace</Label>
                  <Select
                    value={newProjectMarketplace}
                    onValueChange={setNewProjectMarketplace}
                  >
                    <SelectTrigger id="marketplace">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="DE">Germany</SelectItem>
                      <SelectItem value="FR">France</SelectItem>
                      <SelectItem value="IT">Italy</SelectItem>
                      <SelectItem value="ES">Spain</SelectItem>
                      <SelectItem value="JP">Japan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Input
                    id="category"
                    placeholder="e.g., Electronics > Cell Phone Accessories"
                    value={newProjectCategory}
                    onChange={(e) => setNewProjectCategory(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateProject}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Project"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Projects Grid/List */}
      {projects.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <FolderIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first project to get started with listing optimization
            </p>
            <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project: Project) => (
            <Card
              key={project.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <FolderIcon className="h-8 w-8 text-primary" />
                  <Badge className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                </div>
                <CardTitle className="mt-2">{project.name}</CardTitle>
                <CardDescription>
                  {project.marketplace} • {project.category}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <div>
                    <span className="font-semibold text-foreground">
                      {project._count?.keywords || 0}
                    </span>{" "}
                    keywords
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">
                      {project._count?.drafts || 0}
                    </span>{" "}
                    drafts
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link href={`/dashboard/keywords?projectId=${project.id}`}>
                    <SparklesIcon className="mr-2 h-3 w-3" />
                    Keywords
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link href={`/dashboard/listing?projectId=${project.id}`}>
                    <FileTextIcon className="mr-2 h-3 w-3" />
                    Listing
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-left text-sm font-medium">Name</th>
                  <th className="p-4 text-left text-sm font-medium">
                    Marketplace
                  </th>
                  <th className="p-4 text-left text-sm font-medium">
                    Category
                  </th>
                  <th className="p-4 text-left text-sm font-medium">Status</th>
                  <th className="p-4 text-left text-sm font-medium">
                    Keywords
                  </th>
                  <th className="p-4 text-left text-sm font-medium">Drafts</th>
                  <th className="p-4 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project: Project) => (
                  <tr key={project.id} className="border-b hover:bg-muted/50">
                    <td className="p-4 font-medium">{project.name}</td>
                    <td className="p-4">{project.marketplace}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {project.category}
                    </td>
                    <td className="p-4">
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </td>
                    <td className="p-4">{project._count?.keywords || 0}</td>
                    <td className="p-4">{project._count?.drafts || 0}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link
                            href={`/dashboard/keywords?projectId=${project.id}`}
                          >
                            Keywords
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link
                            href={`/dashboard/listing?projectId=${project.id}`}
                          >
                            Listing
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
