"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { KeyIcon, FileTextIcon, TrendingUpIcon } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Create Amazon listings with AI-powered tools
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Keywords Generated
            </CardTitle>
            <KeyIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Total keywords</p>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PPC Campaigns</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Active campaigns</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/dashboard/keywords">
            <Card className="cursor-pointer transition-colors hover:bg-muted/50 h-full">
              <CardHeader>
                <div className="mb-2 rounded-full bg-primary/10 p-3 w-fit">
                  <KeyIcon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Generate Keywords</CardTitle>
                <CardDescription>
                  Extract keywords from competitor ASINs and seed phrases
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/listing">
            <Card className="cursor-pointer transition-colors hover:bg-muted/50 h-full">
              <CardHeader>
                <div className="mb-2 rounded-full bg-primary/10 p-3 w-fit">
                  <FileTextIcon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Build Listing</CardTitle>
                <CardDescription>
                  Create AI-powered Amazon listings with smart keyword placement
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/ppc">
            <Card className="cursor-pointer transition-colors hover:bg-muted/50 h-full">
              <CardHeader>
                <div className="mb-2 rounded-full bg-primary/10 p-3 w-fit">
                  <TrendingUpIcon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>PPC Manager</CardTitle>
                <CardDescription>
                  Manage and optimize your Amazon PPC campaigns
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
