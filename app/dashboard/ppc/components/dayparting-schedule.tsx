"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { Save, RotateCcw } from "lucide-react";

interface DaypartingScheduleProps {
  campaignId: string;
}

interface Schedule {
  dayOfWeek: number;
  hour: number;
  bidModifier: number;
  bidMultiplier?: number; // For backwards compatibility
}

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Color coding for bid multipliers
const getMultiplierColor = (multiplier: number): string => {
  if (multiplier >= 1.5) return "bg-green-500";
  if (multiplier >= 1.2) return "bg-green-400";
  if (multiplier >= 1.0) return "bg-blue-400";
  if (multiplier >= 0.8) return "bg-orange-400";
  if (multiplier >= 0.5) return "bg-red-400";
  return "bg-red-500";
};

const getMultiplierText = (multiplier: number): string => {
  if (multiplier > 1) return `+${((multiplier - 1) * 100).toFixed(0)}%`;
  if (multiplier < 1) return `-${((1 - multiplier) * 100).toFixed(0)}%`;
  return "0%";
};

export default function DaypartingSchedule({
  campaignId,
}: DaypartingScheduleProps) {
  const queryClient = useQueryClient();
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [bulkMultiplier, setBulkMultiplier] = useState<string>("1.0");
  const [presetValue, setPresetValue] = useState<string>("custom");
  const [localGrid, setLocalGrid] = useState<number[][] | null>(null);

  // Fetch existing schedules
  const { data: schedulesData, isLoading } = useQuery({
    queryKey: ["dayparting-schedules", campaignId],
    queryFn: async () => {
      const response = await fetch(
        `/api/ppc/dayparting?campaignId=${campaignId}`
      );
      if (!response.ok) throw new Error("Failed to fetch schedules");
      return response.json();
    },
  });

  // Initialize grid from fetched data using useMemo
  const scheduleGrid = useMemo(() => {
    // If user has made local changes, use those
    if (localGrid !== null) {
      return localGrid;
    }

    // Otherwise use fetched data
    if (schedulesData?.schedules) {
      const grid: number[][] = Array.from({ length: 7 }, () =>
        Array(24).fill(1.0)
      );

      schedulesData.schedules.forEach((schedule: Schedule) => {
        grid[schedule.dayOfWeek][schedule.hour] =
          schedule.bidModifier || schedule.bidMultiplier || 1.0;
      });

      return grid;
    }

    // Default: all hours at 1.0 multiplier
    return Array.from({ length: 7 }, () => Array(24).fill(1.0));
  }, [schedulesData, localGrid]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (
      schedules: { dayOfWeek: number; hour: number; bidMultiplier: number }[]
    ) => {
      const response = await fetch("/api/ppc/dayparting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, schedules }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save schedules");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["dayparting-schedules", campaignId],
      });
      toast.success("Dayparting schedule saved successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save schedule");
    },
  });

  const handleCellClick = (day: number, hour: number) => {
    const cellKey = `${day}-${hour}`;
    setSelectedCells((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cellKey)) {
        newSet.delete(cellKey);
      } else {
        newSet.add(cellKey);
      }
      return newSet;
    });
  };

  const handleCellMouseDown = (day: number, hour: number) => {
    setIsDragging(true);
    handleCellClick(day, hour);
  };

  const handleCellMouseEnter = (day: number, hour: number) => {
    if (isDragging) {
      const cellKey = `${day}-${hour}`;
      setSelectedCells((prev) => new Set([...prev, cellKey]));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const applyMultiplierToSelected = () => {
    const multiplier = parseFloat(bulkMultiplier);
    if (isNaN(multiplier) || multiplier < 0.1 || multiplier > 3.0) {
      toast.error("Multiplier must be between 0.1 and 3.0");
      return;
    }

    const newGrid = scheduleGrid.map((row) => [...row]);
    selectedCells.forEach((cellKey) => {
      const [day, hour] = cellKey.split("-").map(Number);
      newGrid[day][hour] = multiplier;
    });

    setLocalGrid(newGrid);
    setSelectedCells(new Set());
    toast.success(
      `Applied ${getMultiplierText(multiplier)} to ${selectedCells.size} cells`
    );
  };

  const applyPreset = (preset: string) => {
    const newGrid = Array.from({ length: 7 }, () => Array(24).fill(1.0));

    switch (preset) {
      case "business-hours":
        // Mon-Fri 9am-5pm: 1.5x, rest: 0.7x
        for (let day = 1; day <= 5; day++) {
          for (let hour = 0; hour < 24; hour++) {
            newGrid[day][hour] = hour >= 9 && hour <= 17 ? 1.5 : 0.7;
          }
        }
        // Weekend: 0.5x
        [0, 6].forEach((day) => {
          for (let hour = 0; hour < 24; hour++) {
            newGrid[day][hour] = 0.5;
          }
        });
        break;

      case "evening-peak":
        // All days 6pm-10pm: 1.8x, rest: 1.0x
        for (let day = 0; day < 7; day++) {
          for (let hour = 0; hour < 24; hour++) {
            newGrid[day][hour] = hour >= 18 && hour <= 22 ? 1.8 : 1.0;
          }
        }
        break;

      case "weekend-boost":
        // Weekend: 1.5x, Weekday: 1.0x
        [0, 6].forEach((day) => {
          for (let hour = 0; hour < 24; hour++) {
            newGrid[day][hour] = 1.5;
          }
        });
        break;

      case "night-saver":
        // 11pm-6am: 0.5x, rest: 1.0x
        for (let day = 0; day < 7; day++) {
          for (let hour = 0; hour < 24; hour++) {
            newGrid[day][hour] = hour >= 23 || hour <= 6 ? 0.5 : 1.0;
          }
        }
        break;

      default:
        // Reset to 1.0 everywhere
        break;
    }

    setLocalGrid(newGrid);
    toast.success(`Applied ${preset} preset`);
  };

  const handleSave = () => {
    const schedules: {
      dayOfWeek: number;
      hour: number;
      bidMultiplier: number;
    }[] = [];
    scheduleGrid.forEach((row, day) => {
      row.forEach((multiplier, hour) => {
        schedules.push({ dayOfWeek: day, hour, bidMultiplier: multiplier });
      });
    });

    saveMutation.mutate(schedules);
  };

  const handleReset = () => {
    setLocalGrid(Array.from({ length: 7 }, () => Array(24).fill(1.0)));
    setSelectedCells(new Set());
    toast.success("Schedule reset to defaults");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dayparting Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dayparting Schedule</CardTitle>
        <CardDescription>
          Adjust bid multipliers by day and hour. Click and drag to select
          cells, then apply a multiplier.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-2">
            <Label>Quick Presets</Label>
            <Select
              value={presetValue}
              onValueChange={(value) => {
                setPresetValue(value);
                if (value !== "custom") applyPreset(value);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom</SelectItem>
                <SelectItem value="business-hours">
                  Business Hours (9-5)
                </SelectItem>
                <SelectItem value="evening-peak">
                  Evening Peak (6-10pm)
                </SelectItem>
                <SelectItem value="weekend-boost">Weekend Boost</SelectItem>
                <SelectItem value="night-saver">Night Saver</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedCells.size > 0 && (
            <>
              <div className="space-y-2">
                <Label>Bid Multiplier</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="3.0"
                    value={bulkMultiplier}
                    onChange={(e) => setBulkMultiplier(e.target.value)}
                    className="w-[100px]"
                    placeholder="1.0"
                  />
                  <Button onClick={applyMultiplierToSelected} size="sm">
                    Apply to {selectedCells.size}
                  </Button>
                </div>
              </div>
            </>
          )}

          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? "Saving..." : "Save Schedule"}
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-sm">
          <span className="font-medium">Legend:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded" />
            <span>-50% or more</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-400 rounded" />
            <span>-20% to -50%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-400 rounded" />
            <span>±20%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-400 rounded" />
            <span>+20% to +50%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span>+50% or more</span>
          </div>
        </div>

        {/* Grid */}
        <div
          className="overflow-x-auto"
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="inline-block min-w-full">
            <div className="grid grid-cols-[100px_repeat(24,minmax(32px,1fr))] gap-1">
              {/* Header row with hours */}
              <div className="font-semibold text-xs text-center py-2">
                Day / Hour
              </div>
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="font-semibold text-xs text-center py-2"
                >
                  {hour}
                </div>
              ))}

              {/* Rows for each day */}
              {DAYS.map((day, dayIndex) => (
                <>
                  <div
                    key={`day-${dayIndex}`}
                    className="font-medium text-sm py-2 flex items-center"
                  >
                    {day}
                  </div>
                  {HOURS.map((hour) => {
                    const cellKey = `${dayIndex}-${hour}`;
                    const isSelected = selectedCells.has(cellKey);
                    const multiplier = scheduleGrid[dayIndex]?.[hour] || 1.0;

                    return (
                      <div
                        key={cellKey}
                        className={`
                          relative h-12 rounded cursor-pointer transition-all
                          ${getMultiplierColor(multiplier)}
                          ${
                            isSelected
                              ? "ring-2 ring-blue-600 ring-offset-1"
                              : ""
                          }
                          hover:brightness-110
                        `}
                        onMouseDown={() => handleCellMouseDown(dayIndex, hour)}
                        onMouseEnter={() =>
                          handleCellMouseEnter(dayIndex, hour)
                        }
                        title={`${day} ${hour}:00 - ${getMultiplierText(
                          multiplier
                        )}`}
                      >
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white drop-shadow">
                          {multiplier.toFixed(1)}
                        </div>
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {scheduleGrid.flat().filter((m) => m > 1.0).length}
            </div>
            <div className="text-xs text-muted-foreground">Increased Bids</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {scheduleGrid.flat().filter((m) => m === 1.0).length}
            </div>
            <div className="text-xs text-muted-foreground">Normal Bids</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {scheduleGrid.flat().filter((m) => m < 1.0).length}
            </div>
            <div className="text-xs text-muted-foreground">Decreased Bids</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
