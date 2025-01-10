import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Metric } from "@/lib/types";
import { ArrowUpIcon, ArrowDownIcon, ClockIcon, AlertTriangleIcon } from "lucide-react";

interface StatsProps {
  metrics: Metric;
}

export function Stats({ metrics }: StatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
          <ArrowUpIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.openTickets}</div>
          <p className="text-xs text-muted-foreground">
            +{metrics.newTickets} new
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">SLA Breach Rate</CardTitle>
          <AlertTriangleIcon className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.slaBreachRate}%</div>
          <p className="text-xs text-muted-foreground">
            of total tickets
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
          <ClockIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.round(metrics.avgResponseTime)} min</div>
          <p className="text-xs text-muted-foreground">
            first response
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Status Distribution</CardTitle>
          <ArrowDownIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {Object.entries(metrics.statusDistribution).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span className="capitalize">{status}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
