import { Ticket, Metric, ZendeskView } from "./types";

export async function fetchViews(): Promise<ZendeskView[]> {
  const response = await fetch('/api/views');
  if (!response.ok) throw new Error("Failed to fetch views");
  return response.json();
}

export async function fetchTickets(viewId?: number, status?: string): Promise<Ticket[]> {
  const params = new URLSearchParams();
  if (viewId) params.append("viewId", viewId.toString());
  if (status) params.append("status", status);

  const response = await fetch(`/api/tickets?${params}`);
  if (!response.ok) throw new Error("Failed to fetch tickets");
  return response.json();
}

export async function fetchMetrics(viewId?: number): Promise<Metric> {
  const params = new URLSearchParams();
  if (viewId) params.append("viewId", viewId.toString());

  const response = await fetch(`/api/metrics?${params}`);
  if (!response.ok) throw new Error("Failed to fetch metrics");
  return response.json();
}

export async function fetchMetricsHistory(): Promise<Metric[]> {
  const response = await fetch('/api/metrics/history');
  if (!response.ok) throw new Error("Failed to fetch metrics history");
  return response.json();
}