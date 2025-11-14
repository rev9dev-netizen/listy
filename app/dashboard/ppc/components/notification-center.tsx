"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bell,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CheckCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: string;
  severity: string;
  message: string;
  read: boolean;
  createdAt: string | Date;
  campaignId?: string;
  campaignName?: string;
  data?: Record<string, unknown>;
}

export default function NotificationCenter() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Fetch notifications
  const { data: notificationsData } = useQuery({
    queryKey: ["ppc-notifications"],
    queryFn: async () => {
      const response = await fetch("/api/ppc/notifications");
      if (!response.ok) throw new Error("Failed to fetch notifications");
      return response.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (notificationId?: string) => {
      const response = await fetch("/api/ppc/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          notificationId ? { notificationId } : { markAllRead: true }
        ),
      });
      if (!response.ok) throw new Error("Failed to mark as read");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ppc-notifications"] });
    },
  });

  const notifications: Notification[] = notificationsData?.notifications || [];
  const unreadCount = notificationsData?.unreadCount || 0;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "BudgetWarning":
        return <DollarSign className="w-4 h-4 text-yellow-600" />;
      case "AcosSpike":
        return <TrendingUp className="w-4 h-4 text-red-600" />;
      case "ConversionDrop":
        return <TrendingDown className="w-4 h-4 text-orange-600" />;
      case "BidIncrease":
      case "ImpressionLoss":
      case "RankDrop":
      case "CPCSpike":
        return <AlertCircle className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "High":
        return "text-red-600 bg-red-50";
      case "Medium":
        return "text-yellow-600 bg-yellow-50";
      case "Low":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markReadMutation.mutate(notification.id);
    }

    // Navigate to campaign if available
    if (notification.campaignId) {
      router.push(`/dashboard/ppc/campaigns/${notification.campaignId}`);
      setOpen(false);
    }
  };

  const handleMarkAllRead = () => {
    markReadMutation.mutate(undefined);
    toast.success("All notifications marked as read");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold">Notifications</h3>
            <p className="text-xs text-muted-foreground">
              {unreadCount} unread
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markReadMutation.isPending}
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                    !notification.read ? "bg-blue-50/50" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className="shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getSeverityColor(
                            notification.severity
                          )}`}
                        >
                          {notification.severity}
                        </Badge>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-blue-600 mt-1" />
                        )}
                      </div>
                      <p className="text-sm font-medium mb-1">
                        {notification.message}
                      </p>
                      {notification.campaignName && (
                        <p className="text-xs text-muted-foreground mb-1">
                          Campaign: {notification.campaignName}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                setOpen(false);
                router.push("/dashboard/ppc/alerts");
              }}
            >
              View All Alerts
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
