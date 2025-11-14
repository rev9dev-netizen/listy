"use client";

import CompetitorAlerts from "../components/competitor-alerts";

export default function CompetitorAlertsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Competitor Alerts</h1>
        <p className="text-muted-foreground mt-2">
          Monitor competitor activity and stay ahead of the competition
        </p>
      </div>

      <CompetitorAlerts />
    </div>
  );
}
