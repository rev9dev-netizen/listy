"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, DollarSign, Target, BarChart3 } from "lucide-react";

interface Metric {
  date: Date;
  impressions: number;
  clicks: number;
  spend: number;
  sales: number;
  orders: number;
  acos: number;
  roas: number;
  ctr: number;
  cpc: number;
  conversionRate: number;
}

interface Keyword {
  id: string;
  keyword: string;
  spend: number;
  sales: number;
  acos: number;
  clicks: number;
  conversions: number;
}

interface CampaignChartsProps {
  metrics: Metric[];
  keywords: Keyword[];
  dailyBudget: number;
}

const COLORS = {
  primary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  cyan: "#06b6d4",
};

const PIE_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#14b8a6",
];

// Custom tooltip component with proper types
interface TooltipPayload {
  name: string;
  value: number | string;
  color: string;
  dataKey?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}:{" "}
            {typeof entry.value === "number"
              ? entry.name.includes("ACOS") || entry.name.includes("%")
                ? `${entry.value.toFixed(1)}%`
                : entry.name.includes("$") ||
                  entry.dataKey === "spend" ||
                  entry.dataKey === "sales" ||
                  entry.dataKey === "cpc"
                ? `$${entry.value.toFixed(2)}`
                : entry.value.toLocaleString()
              : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function CampaignCharts({
  metrics,
  keywords,
}: CampaignChartsProps) {
  // Prepare time series data
  const timeSeriesData = useMemo(() => {
    return metrics
      .map((m) => ({
        date: new Date(m.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        spend: m.spend,
        sales: m.sales,
        acos: m.acos,
        clicks: m.clicks,
        conversions: m.orders,
        ctr: m.ctr,
        cpc: m.cpc,
      }))
      .reverse();
  }, [metrics]);

  // Top keywords by spend
  const topKeywordsBySpend = useMemo(() => {
    return [...keywords]
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 10)
      .map((k) => ({
        name:
          k.keyword.length > 20
            ? k.keyword.substring(0, 20) + "..."
            : k.keyword,
        spend: k.spend,
        sales: k.sales,
        acos: k.acos,
      }));
  }, [keywords]);

  // Budget allocation pie chart data
  const budgetAllocationData = useMemo(() => {
    const totalSpend = keywords.reduce((sum, k) => sum + k.spend, 0);
    const topKeywords = [...keywords]
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 7);

    const chartData = topKeywords.map((k) => ({
      name:
        k.keyword.length > 15 ? k.keyword.substring(0, 15) + "..." : k.keyword,
      value: k.spend,
      percentage: ((k.spend / totalSpend) * 100).toFixed(1),
    }));

    const othersSpend = keywords.slice(7).reduce((sum, k) => sum + k.spend, 0);

    if (othersSpend > 0) {
      chartData.push({
        name: "Others",
        value: othersSpend,
        percentage: ((othersSpend / totalSpend) * 100).toFixed(1),
      });
    }

    return chartData;
  }, [keywords]);

  // Performance distribution
  const performanceDistribution = useMemo(() => {
    const excellent = keywords.filter((k) => k.acos < 20).length;
    const good = keywords.filter((k) => k.acos >= 20 && k.acos < 30).length;
    const average = keywords.filter((k) => k.acos >= 30 && k.acos < 50).length;
    const poor = keywords.filter((k) => k.acos >= 50).length;

    return [
      { name: "Excellent (<20%)", value: excellent, fill: COLORS.success },
      { name: "Good (20-30%)", value: good, fill: COLORS.primary },
      { name: "Average (30-50%)", value: average, fill: COLORS.warning },
      { name: "Poor (>50%)", value: poor, fill: COLORS.danger },
    ].filter((d) => d.value > 0);
  }, [keywords]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">
            <TrendingUp className="w-4 h-4 mr-2" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Target className="w-4 h-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="keywords">
            <BarChart3 className="w-4 h-4 mr-2" />
            Top Keywords
          </TabsTrigger>
          <TabsTrigger value="distribution">
            <DollarSign className="w-4 h-4 mr-2" />
            Distribution
          </TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Spend & Sales Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={timeSeriesData}>
                  <defs>
                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={COLORS.danger}
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor={COLORS.danger}
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={COLORS.success}
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor={COLORS.success}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="spend"
                    stroke={COLORS.danger}
                    fillOpacity={1}
                    fill="url(#colorSpend)"
                    name="Spend ($)"
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke={COLORS.success}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                    name="Sales ($)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ACOS Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="acos"
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="ACOS (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clicks & Conversions</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="clicks" fill={COLORS.primary} name="Clicks" />
                  <Bar
                    dataKey="conversions"
                    fill={COLORS.success}
                    name="Conversions"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>CTR & CPC Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="ctr"
                      stroke={COLORS.purple}
                      strokeWidth={2}
                      name="CTR (%)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="cpc"
                      stroke={COLORS.cyan}
                      strokeWidth={2}
                      name="CPC ($)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Keywords by ACOS</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={performanceDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {performanceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Top Keywords Tab */}
        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Keywords by Spend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topKeywordsBySpend} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="spend" fill={COLORS.danger} name="Spend ($)" />
                  <Bar dataKey="sales" fill={COLORS.success} name="Sales ($)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Keywords ACOS</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topKeywordsBySpend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="acos" fill={COLORS.primary} name="ACOS (%)">
                    {topKeywordsBySpend.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.acos < 20
                            ? COLORS.success
                            : entry.acos < 30
                            ? COLORS.primary
                            : entry.acos < 50
                            ? COLORS.warning
                            : COLORS.danger
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Allocation by Keyword</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={budgetAllocationData}
                    cx="50%"
                    cy="50%"
                    labelLine
                    label={(props) => {
                      const { name, percent } = props as {
                        name?: string;
                        percent?: number;
                      };
                      return name && percent
                        ? `${name}: ${percent.toFixed(1)}%`
                        : "";
                    }}
                    outerRadius={120}
                    dataKey="value"
                  >
                    {budgetAllocationData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border rounded-lg shadow-lg p-3">
                            <p className="font-semibold">{data.name}</p>
                            <p className="text-sm">
                              Spend: ${data.value.toFixed(2)}
                            </p>
                            <p className="text-sm">
                              Percentage: {data.percentage}%
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
