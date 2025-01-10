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
    // Use the active views endpoint to get only relevant views
    const response = await fetch(
      `https://${ZENDESK_DOMAIN}.zendesk.com/api/v2/views/active.json`,
      { headers }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Zendesk API error: ${response.status} - ${error.error}`);
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

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchTicketsFromView(viewId: number, pageSize: number = 100): Promise<any[]> {
  let allTickets: any[] = [];
  let hasMore = true;
  let cursor: string | null = null;

  while (hasMore) {
    try {
      // Build the URL with pagination parameters
      let url = `https://${ZENDESK_DOMAIN}.zendesk.com/api/v2/views/${viewId}/tickets.json?page[size]=${pageSize}`;
      if (cursor) {
        url += `&page[after]=${cursor}`;
      }

      const response = await fetch(url, { headers });

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('retry-after') || '60');
        console.log(`Rate limited, waiting ${retryAfter} seconds...`);
        await delay(retryAfter * 1000);
        continue;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Zendesk API error: ${response.status} - ${error.error}`);
      }

      const data = await response.json();
      allTickets = allTickets.concat(data.tickets);

      // Update pagination info
      const links = response.headers.get('link');
      if (links && links.includes('rel="next"')) {
        // Extract cursor from the next link
        const match = links.match(/page%5Bafter%5D=([^&>"]+)/);
        cursor = match ? match[1] : null;
      } else {
        hasMore = false;
      }

      // Add a small delay between requests to prevent rate limiting
      await delay(100);
    } catch (error) {
      console.error("Error fetching tickets from view:", error);
      throw error;
    }
  }

  return allTickets;
}

export async function fetchTickets(timeRange: string, viewId?: number): Promise<Ticket[]> {
  if (!viewId) {
    throw new Error("View ID is required");
  }

  try {
    console.log(`Fetching tickets from view ${viewId}`);
    const tickets = await fetchTicketsFromView(viewId);
    console.log(`Retrieved ${tickets.length} tickets from view ${viewId}`);

    // Filter tickets based on time range
    const startTime = new Date();
    switch(timeRange) {
      case "1h": startTime.setHours(startTime.getHours() - 1); break;
      case "4h": startTime.setHours(startTime.getHours() - 4); break;
      case "12h": startTime.setHours(startTime.getHours() - 12); break;
      case "7d": startTime.setDate(startTime.getDate() - 7); break;
      default: startTime.setHours(startTime.getHours() - 24);
    }

    return tickets
      .filter(ticket => new Date(ticket.created_at) >= startTime)
      .map(ticket => ({
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