import { Ticket, Metric, TimeRange } from "./types";

export async function fetchTickets(timeRange: TimeRange, status?: string): Promise<Ticket[]> {
  const params = new URLSearchParams({ timeRange });
  if (status) params.append("status", status);
  
  const response = await fetch(`/api/tickets?${params}`);
  if (!response.ok) throw new Error("Failed to fetch tickets");
  return response.json();
}

export async function fetchMetrics(timeRange: TimeRange): Promise<Metric> {
  const response = await fetch(`/api/metrics?timeRange=${timeRange}`);
  if (!response.ok) throw new Error("Failed to fetch metrics");
  return response.json();
}

export async function fetchMetricsHistory(timeRange: TimeRange): Promise<Metric[]> {
  const response = await fetch(`/api/metrics/history?timeRange=${timeRange}`);
  if (!response.ok) throw new Error("Failed to fetch metrics history");
  return response.json();
}
