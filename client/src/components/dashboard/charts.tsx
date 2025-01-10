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
  const labels = metricsHistory.map(m => 
    new Date(m.timestamp).toLocaleTimeString()
  ).reverse();

  const trendsData: ChartData<"line"> = {
    labels,
    datasets: [
      {
        label: 'Open Tickets',
        data: metricsHistory.map(m => m.openTickets).reverse(),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      {
        label: 'SLA Breach Rate',
        data: metricsHistory.map(m => m.slaBreachRate).reverse(),
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
        data: metricsHistory.map(m => m.avgResponseTime).reverse(),
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
                }
              }
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
