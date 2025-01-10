import { Ticket } from "@db/schema";

const ZENDESK_DOMAIN = process.env.ZENDESK_DOMAIN;
const ZENDESK_EMAIL = process.env.ZENDESK_EMAIL;
const ZENDESK_TOKEN = process.env.ZENDESK_TOKEN;

const headers = {
  'Authorization': 'Basic ' + Buffer.from(`${ZENDESK_EMAIL}/token:${ZENDESK_TOKEN}`).toString('base64'),
  'Content-Type': 'application/json'
};

export async function fetchTickets(timeRange: string): Promise<Ticket[]> {
  try {
    const response = await fetch(
      `https://${ZENDESK_DOMAIN}.zendesk.com/api/v2/tickets.json?include=metrics`,
      { headers }
    );
    
    if (!response.ok) {
      throw new Error(`Zendesk API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.tickets.map((ticket: any) => ({
      zendeskId: ticket.id.toString(),
      status: ticket.status,
      priority: ticket.priority,
      subject: ticket.subject,
      description: ticket.description,
      assigneeId: ticket.assignee_id?.toString(),
      requesterId: ticket.requester_id.toString(),
      createdAt: new Date(ticket.created_at),
      updatedAt: new Date(ticket.updated_at),
      firstResponseTime: ticket.metrics?.reply_time_in_minutes?.calendar || null,
      resolutionTime: ticket.metrics?.resolution_time_in_minutes?.calendar || null,
      slaBreached: ticket.metrics?.sla_breach || false,
      metadata: ticket.metadata || {}
    }));
  } catch (error) {
    console.error("Error fetching Zendesk tickets:", error);
    return [];
  }
}
