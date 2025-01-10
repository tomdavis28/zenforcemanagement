import { Ticket } from "@db/schema";
import { ZendeskView } from "../client/src/lib/types";

const ZENDESK_DOMAIN = process.env.ZENDESK_DOMAIN;
const ZENDESK_EMAIL = process.env.ZENDESK_EMAIL;
const ZENDESK_TOKEN = process.env.ZENDESK_TOKEN;

const headers = {
  'Authorization': 'Basic ' + Buffer.from(`${ZENDESK_EMAIL}/token:${ZENDESK_TOKEN}`).toString('base64'),
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

export async function fetchViews(): Promise<ZendeskView[]> {
  try {
    const response = await fetch(
      `https://${ZENDESK_DOMAIN}.zendesk.com/api/v2/views.json`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`Zendesk API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return data.views.map((view: any) => ({
      id: view.id,
      title: view.title
    }));
  } catch (error) {
    console.error("Error fetching Zendesk views:", error);
    throw error;
  }
}

export async function fetchTickets(timeRange: string, viewId?: number): Promise<Ticket[]> {
  try {
    const startTime = new Date();
    switch(timeRange) {
      case "1h": startTime.setHours(startTime.getHours() - 1); break;
      case "4h": startTime.setHours(startTime.getHours() - 4); break;
      case "12h": startTime.setHours(startTime.getHours() - 12); break;
      case "7d": startTime.setDate(startTime.getDate() - 7); break;
      default: startTime.setHours(startTime.getHours() - 24);
    }

    // Always use the views/tickets endpoint for better performance and accuracy
    const endpoint = `https://${ZENDESK_DOMAIN}.zendesk.com/api/v2/views/${viewId}/tickets.json?per_page=100`;
    console.log(`Fetching tickets from view ${viewId}`);

    const response = await fetch(endpoint, { headers });

    if (!response.ok) {
      throw new Error(`Zendesk API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Retrieved ${data.tickets.length} tickets from view ${viewId}`);

    return data.tickets.map((ticket: any) => ({
      zendeskId: ticket.id.toString(),
      status: ticket.status,
      priority: ticket.priority || null,
      subject: ticket.subject,
      description: ticket.description || null,
      assigneeId: ticket.assignee_id?.toString() || null,
      requesterId: ticket.requester_id.toString(),
      createdAt: new Date(ticket.created_at),
      updatedAt: new Date(ticket.updated_at),
      firstResponseTime: ticket.metric_set?.reply_time_in_minutes?.business || null,
      resolutionTime: ticket.metric_set?.resolution_time_in_minutes?.business || null,
      slaBreached: Boolean(ticket.metric_set?.first_resolution_time_in_minutes?.breach_at),
      metadata: {
        tags: ticket.tags,
        channel: ticket.via?.channel,
        satisfaction_score: ticket.satisfaction_rating?.score,
        metric_set: ticket.metric_set
      },
      viewId
    }));
  } catch (error) {
    console.error("Error fetching Zendesk tickets:", error);
    throw error;
  }
}