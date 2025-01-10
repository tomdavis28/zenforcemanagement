import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Metric } from "@/lib/types";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartData
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ChartsProps {
  metricsHistory: Metric[];
}

export function Charts({ metricsHistory }: ChartsProps) {
  // Format timestamps and sort data chronologically
  const sortedMetrics = [...metricsHistory].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const labels = sortedMetrics.map(m => 
    new Date(m.timestamp).toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  );

  const trendsData: ChartData<"line"> = {
    labels,
    datasets: [
      {
        label: 'Open Tickets',
        data: sortedMetrics.map(m => m.openTickets),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      {
        label: 'SLA Breach Rate (%)',
        data: sortedMetrics.map(m => m.slaBreachRate),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      }
    ],
  };

  const responseTimeData: ChartData<"bar"> = {
    labels,
    datasets: [
      {
        label: 'Average Response Time (min)',
        data: sortedMetrics.map(m => m.avgResponseTime),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      }
    ],
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <Line
            data={trendsData}
            options={{
              responsive: true,
              interaction: {
                mode: 'index' as const,
                intersect: false,
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: (value) => value.toString()
                  }
                }
              }
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Response Time</CardTitle>
        </CardHeader>
        <CardContent>
          <Bar
            data={responseTimeData}
            options={{
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: (value) => `${value} min`
                  }
                }
              }
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}