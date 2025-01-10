import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { TimeRange } from "@/lib/types";
import { fetchMetrics, fetchMetricsHistory } from "@/lib/api";
import { Filters } from "@/components/dashboard/filters";
import { Stats } from "@/components/dashboard/stats";
import { Charts } from "@/components/dashboard/charts";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");

  const { data: metrics, isLoading: isLoadingMetrics, error: metricsError } = useQuery({
    queryKey: ["/api/metrics", timeRange],
    queryFn: () => fetchMetrics(timeRange),
    refetchInterval: 10 * 60 * 1000 // 10 minutes
  });

  const { data: metricsHistory, isLoading: isLoadingHistory, error: historyError } = useQuery({
    queryKey: ["/api/metrics/history", timeRange],
    queryFn: () => fetchMetricsHistory(timeRange),
    refetchInterval: 10 * 60 * 1000
  });

  const showConfigurationMessage = metricsError?.message?.includes("Zendesk credentials not configured");

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Zendesk Analytics</h1>
        <Filters timeRange={timeRange} onTimeRangeChange={setTimeRange} />
      </div>

      {showConfigurationMessage ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Zendesk credentials are not configured. Please configure your Zendesk API credentials to start collecting analytics data.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {isLoadingMetrics ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-[120px] rounded-lg" />
              ))}
            </div>
          ) : metrics ? (
            <Stats metrics={metrics} />
          ) : null}

          {isLoadingHistory ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-[300px] rounded-lg" />
              ))}
            </div>
          ) : metricsHistory ? (
            <Charts metricsHistory={metricsHistory} />
          ) : null}
        </>
      )}
    </div>
  );
}