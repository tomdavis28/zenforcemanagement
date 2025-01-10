export interface Ticket {
  id: number;
  zendeskId: string;
  status: string;
  priority: string | null;
  subject: string;
  description: string | null;
  assigneeId: string | null;
  requesterId: string;
  createdAt: string;
  updatedAt: string;
  firstResponseTime: number | null;
  resolutionTime: number | null;
  slaBreached: boolean;
  metadata: Record<string, any>;
}

export interface Metric {
  id: number;
  timestamp: string;
  openTickets: number;
  newTickets: number;
  slaBreachRate: number;
  avgResponseTime: number;
  statusDistribution: Record<string, number>;
  timeRange: string;
  viewId: number | null;
}

export type TimeRange = "1h" | "4h" | "12h" | "24h" | "7d";

export interface ZendeskView {
  id: number;
  title: string;
}