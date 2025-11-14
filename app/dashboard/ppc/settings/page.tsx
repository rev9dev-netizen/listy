"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Settings, Save, AlertCircle, CheckCircle2, Globe } from "lucide-react";

interface PpcSettings {
  defaultBidStrategy: string;
  automationThresholds: {
    acosTarget: number;
    pauseKeywordAcos: number;
    pauseKeywordSpend: number;
    budgetWarningThreshold: number;
    bidAdjustmentPercent: number;
  };
  cogsPercentages: {
    [category: string]: number;
  };
  notifications: {
    emailEnabled: boolean;
    inAppEnabled: boolean;
    budgetAlerts: boolean;
    acosAlerts: boolean;
    conversionAlerts: boolean;
    competitorAlerts: boolean;
    frequency: string;
  };
  marketplace: {
    default: string;
    enabled: string[];
  };
  apiCredentials?: {
    amazonAdsConfigured: boolean;
    marketplacesConfigured: string[];
  };
}

const BID_STRATEGIES = [
  "Dynamic bids - down only",
  "Dynamic bids - up and down",
  "Fixed bids",
];

const MARKETPLACES = [
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "UK", name: "United Kingdom", flag: "🇬🇧" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
];

const NOTIFICATION_FREQUENCIES = [
  { value: "immediate", label: "Immediate" },
  { value: "hourly", label: "Hourly Digest" },
  { value: "daily", label: "Daily Digest" },
  { value: "weekly", label: "Weekly Summary" },
];

export default function PPCSettingsPage() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<PpcSettings | null>(null);

  // Fetch settings
  const { isLoading } = useQuery({
    queryKey: ["ppcSettings"],
    queryFn: async () => {
      const res = await fetch("/api/ppc/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      const data = await res.json();
      setSettings(data);
      return data;
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: Partial<PpcSettings>) => {
      const res = await fetch("/api/ppc/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSettings),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update settings");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ppcSettings"] });
      toast.success("Settings saved successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSave = () => {
    if (!settings) return;
    updateSettingsMutation.mutate(settings);
  };

  const updateSetting = <K extends keyof PpcSettings>(
    key: K,
    value: PpcSettings[K]
  ) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  if (isLoading || !settings) {
    return (
      <div className="p-8">
        <div className="text-center text-muted-foreground">
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            PPC Settings
          </h1>
          <p className="text-muted-foreground">
            Configure automation rules, preferences, and API credentials
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={updateSettingsMutation.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* API Status Alert */}
      <Alert
        variant={
          settings.apiCredentials?.amazonAdsConfigured
            ? "default"
            : "destructive"
        }
      >
        {settings.apiCredentials?.amazonAdsConfigured ? (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : (
          <AlertCircle className="h-4 w-4" />
        )}
        <AlertTitle>Amazon Ads API Status</AlertTitle>
        <AlertDescription>
          {settings.apiCredentials?.amazonAdsConfigured ? (
            <div className="space-y-2">
              <p className="text-green-600 font-medium">
                ✓ API credentials configured
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-sm">Marketplaces:</span>
                {settings.apiCredentials.marketplacesConfigured.map((mp) => (
                  <Badge key={mp} variant="secondary">
                    {MARKETPLACES.find((m) => m.code === mp)?.flag} {mp}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-2">
                Amazon Ads API is not configured. Add the following environment
                variables to enable full functionality:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>
                  <code className="text-xs bg-background px-1 py-0.5 rounded">
                    AMAZON_ADS_CLIENT_ID
                  </code>
                </li>
                <li>
                  <code className="text-xs bg-background px-1 py-0.5 rounded">
                    AMAZON_ADS_CLIENT_SECRET
                  </code>
                </li>
                <li>
                  <code className="text-xs bg-background px-1 py-0.5 rounded">
                    AMAZON_ADS_REFRESH_TOKEN
                  </code>
                </li>
                <li>
                  <code className="text-xs bg-background px-1 py-0.5 rounded">
                    AMAZON_ADS_PROFILE_ID_[MARKETPLACE]
                  </code>
                </li>
              </ul>
            </div>
          )}
        </AlertDescription>
      </Alert>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="cogs">COGS</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="marketplaces">Marketplaces</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Default Bid Strategy</CardTitle>
              <CardDescription>
                Set your preferred bidding strategy for new campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Bid Strategy</Label>
                <Select
                  value={settings.defaultBidStrategy}
                  onValueChange={(value) =>
                    updateSetting("defaultBidStrategy", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BID_STRATEGIES.map((strategy) => (
                      <SelectItem key={strategy} value={strategy}>
                        {strategy}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation Settings */}
        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automation Thresholds</CardTitle>
              <CardDescription>
                Configure when automated rules should trigger
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="acosTarget">Target ACOS (%)</Label>
                  <Input
                    id="acosTarget"
                    type="number"
                    min="0"
                    max="100"
                    value={settings.automationThresholds.acosTarget}
                    onChange={(e) =>
                      updateSetting("automationThresholds", {
                        ...settings.automationThresholds,
                        acosTarget: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Your ideal advertising cost of sales
                  </p>
                </div>

                <div>
                  <Label htmlFor="pauseAcos">Pause Keyword ACOS (%)</Label>
                  <Input
                    id="pauseAcos"
                    type="number"
                    min="0"
                    max="100"
                    value={settings.automationThresholds.pauseKeywordAcos}
                    onChange={(e) =>
                      updateSetting("automationThresholds", {
                        ...settings.automationThresholds,
                        pauseKeywordAcos: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Automatically pause keywords above this ACOS
                  </p>
                </div>

                <div>
                  <Label htmlFor="pauseSpend">Pause Keyword Spend ($)</Label>
                  <Input
                    id="pauseSpend"
                    type="number"
                    min="0"
                    value={settings.automationThresholds.pauseKeywordSpend}
                    onChange={(e) =>
                      updateSetting("automationThresholds", {
                        ...settings.automationThresholds,
                        pauseKeywordSpend: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum spend before auto-pausing
                  </p>
                </div>

                <div>
                  <Label htmlFor="budgetWarning">Budget Warning (%)</Label>
                  <Input
                    id="budgetWarning"
                    type="number"
                    min="0"
                    max="100"
                    value={settings.automationThresholds.budgetWarningThreshold}
                    onChange={(e) =>
                      updateSetting("automationThresholds", {
                        ...settings.automationThresholds,
                        budgetWarningThreshold: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Alert when budget utilization exceeds this
                  </p>
                </div>

                <div>
                  <Label htmlFor="bidAdjustment">Bid Adjustment (%)</Label>
                  <Input
                    id="bidAdjustment"
                    type="number"
                    min="0"
                    max="100"
                    value={settings.automationThresholds.bidAdjustmentPercent}
                    onChange={(e) =>
                      updateSetting("automationThresholds", {
                        ...settings.automationThresholds,
                        bidAdjustmentPercent: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Max bid change per automation cycle
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* COGS Settings */}
        <TabsContent value="cogs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost of Goods Sold (COGS)</CardTitle>
              <CardDescription>
                Set COGS percentages by product category for profit calculations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(settings.cogsPercentages).map(
                  ([category, percentage]) => (
                    <div key={category}>
                      <Label
                        htmlFor={`cogs-${category}`}
                        className="capitalize"
                      >
                        {category} COGS (%)
                      </Label>
                      <Input
                        id={`cogs-${category}`}
                        type="number"
                        min="0"
                        max="100"
                        value={percentage}
                        onChange={(e) =>
                          updateSetting("cogsPercentages", {
                            ...settings.cogsPercentages,
                            [category]: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how and when you want to receive alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="emailEnabled"
                    checked={settings.notifications.emailEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting("notifications", {
                        ...settings.notifications,
                        emailEnabled: checked === true,
                      })
                    }
                  />
                  <Label htmlFor="emailEnabled">
                    Enable email notifications
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="inAppEnabled"
                    checked={settings.notifications.inAppEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting("notifications", {
                        ...settings.notifications,
                        inAppEnabled: checked === true,
                      })
                    }
                  />
                  <Label htmlFor="inAppEnabled">
                    Enable in-app notifications
                  </Label>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Alert Types</h4>
                <div className="space-y-2">
                  {[
                    { key: "budgetAlerts", label: "Budget warnings" },
                    { key: "acosAlerts", label: "ACOS spikes" },
                    { key: "conversionAlerts", label: "Conversion drops" },
                    { key: "competitorAlerts", label: "Competitor activity" },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={
                          settings.notifications[
                            key as keyof typeof settings.notifications
                          ] as boolean
                        }
                        onCheckedChange={(checked) =>
                          updateSetting("notifications", {
                            ...settings.notifications,
                            [key]: checked === true,
                          })
                        }
                      />
                      <Label htmlFor={key}>{label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <Label>Notification Frequency</Label>
                <Select
                  value={settings.notifications.frequency}
                  onValueChange={(value) =>
                    updateSetting("notifications", {
                      ...settings.notifications,
                      frequency: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTIFICATION_FREQUENCIES.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Marketplace Settings */}
        <TabsContent value="marketplaces" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Marketplace Configuration
              </CardTitle>
              <CardDescription>
                Select which Amazon marketplaces you want to manage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Default Marketplace</Label>
                <Select
                  value={settings.marketplace.default}
                  onValueChange={(value) =>
                    updateSetting("marketplace", {
                      ...settings.marketplace,
                      default: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MARKETPLACES.map((mp) => (
                      <SelectItem key={mp.code} value={mp.code}>
                        {mp.flag} {mp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Enabled Marketplaces</h4>
                <div className="grid grid-cols-2 gap-3">
                  {MARKETPLACES.map((mp) => {
                    const isConfigured =
                      settings.apiCredentials?.marketplacesConfigured?.includes(
                        mp.code
                      ) || false;
                    return (
                      <div
                        key={mp.code}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`mp-${mp.code}`}
                            checked={settings.marketplace.enabled.includes(
                              mp.code
                            )}
                            onCheckedChange={(checked) => {
                              const enabled = checked
                                ? [...settings.marketplace.enabled, mp.code]
                                : settings.marketplace.enabled.filter(
                                    (code) => code !== mp.code
                                  );
                              updateSetting("marketplace", {
                                ...settings.marketplace,
                                enabled,
                              });
                            }}
                          />
                          <Label
                            htmlFor={`mp-${mp.code}`}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <span className="text-xl">{mp.flag}</span>
                            <span>{mp.name}</span>
                          </Label>
                        </div>
                        {isConfigured ? (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />
                            API Ready
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            No API
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
