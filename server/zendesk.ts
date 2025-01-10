import { Ticket } from "@db/schema";

const ZENDESK_DOMAIN = process.env.ZENDESK_DOMAIN;
const ZENDESK_EMAIL = process.env.ZENDESK_EMAIL;
const ZENDESK_TOKEN = process.env.ZENDESK_TOKEN;

const headers = {
  'Authorization': 'Basic ' + Buffer.from(`${ZENDESK_EMAIL}/token:${ZENDESK_TOKEN}`).toString('base64'),
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

export async function fetchTickets(timeRange: string): Promise<Ticket[]> {
  try {
    // Calculate the start time based on the time range
    const startTime = new Date();
    switch(timeRange) {
      case "1h": startTime.setHours(startTime.getHours() - 1); break;
      case "4h": startTime.setHours(startTime.getHours() - 4); break;
      case "12h": startTime.setHours(startTime.getHours() - 12); break;
      case "7d": startTime.setDate(startTime.getDate() - 7); break;
      default: startTime.setHours(startTime.getHours() - 24); // 24h default
    }

    // Format the date for Zendesk API
    const startTimeStr = startTime.toISOString();

    const response = await fetch(
      `https://${ZENDESK_DOMAIN}.zendesk.com/api/v2/search.json?query=type:ticket created>${startTimeStr}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`Zendesk API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return data.results.map((ticket: any) => ({
      zendeskId: ticket.id.toString(),
      status: ticket.status,
      priority: ticket.priority || null,
      subject: ticket.subject,
      description: ticket.description || null,
      assigneeId: ticket.assignee_id?.toString() || null,
      requesterId: ticket.requester_id.toString(),
      createdAt: new Date(ticket.created_at),
      updatedAt: new Date(ticket.updated_at),
      firstResponseTime: ticket.first_response_time_in_minutes?.calendar || null,
      resolutionTime: ticket.full_resolution_time_in_minutes?.calendar || null,
      slaBreached: Boolean(ticket.sla_breach_at),
      metadata: {
        tags: ticket.tags,
        channel: ticket.via?.channel,
        satisfaction_score: ticket.satisfaction_rating?.score
      }
    }));
  } catch (error) {
    console.error("Error fetching Zendesk tickets:", error);
    throw error; // Re-throw to let the caller handle the error
  }
}