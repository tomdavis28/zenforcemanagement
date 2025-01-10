import { db } from "@db";
import { tickets, metrics, views } from "@db/schema";
import { fetchTickets } from "./zendesk";
import { eq } from "drizzle-orm";

const REFRESH_INTERVAL = 60 * 1000; // 1 minute

async function updateMetrics() {
  console.log("Starting metrics update cycle...");

  // Check if Zendesk credentials are available
  if (!process.env.ZENDESK_DOMAIN || !process.env.ZENDESK_EMAIL || !process.env.ZENDESK_TOKEN) {
    console.error("Error: Zendesk credentials not configured. Skipping metrics update.");
    return;
  }

  try {
    // Get all enabled views
    console.log("Fetching enabled views from database...");
    const enabledViews = await db.select().from(views).where(eq(views.enabled, true));
    console.log(`Found ${enabledViews.length} enabled views`);

    if (enabledViews.length === 0) {
      console.warn("No enabled views found in database. Skipping metrics update.");
      return;
    }

    for (const view of enabledViews) {
      console.log(`Processing view ${view.id}...`);

      try {
        // Get current state of tickets in the view
        console.log(`Fetching tickets for view ${view.id} from Zendesk...`);
        const viewTickets = await fetchTickets(view.id);
        console.log(`Retrieved ${viewTickets.length} tickets for view ${view.id}`);

        // Store metrics for the view
        console.log(`Calculating and storing metrics for view ${view.id}...`);
        await storeMetrics(viewTickets, view.id);
        console.log(`Successfully processed view ${view.id}`);
      } catch (error) {
        console.error(`Failed to process view ${view.id}:`, error);
        // Continue with next view instead of breaking the entire cycle
      }
    }
    console.log("Completed metrics update cycle");
  } catch (error) {
    console.error("Critical error in metrics update cycle:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
  }
}

async function storeMetrics(tickets: any[], viewId: number) {
  try {
    console.log(`Calculating metrics for view ${viewId}...`);

    // Count tickets by their current state
    const openTickets = tickets.filter(t => t.status === "open" || t.status === "new").length;
    console.log(`Open tickets count: ${openTickets}`);

    // Count tickets created in the last 24 hours as new
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newTickets = tickets.filter(t => new Date(t.createdAt) >= last24Hours).length;
    console.log(`New tickets (last 24h): ${newTickets}`);

    const slaBreachCount = tickets.filter(t => t.slaBreached).length;
    const slaBreachRate = tickets.length ? Math.round((slaBreachCount / tickets.length) * 100) : 0;
    console.log(`SLA breach rate: ${slaBreachRate}%`);

    const responseTimes = tickets
      .map(t => t.firstResponseTime)
      .filter((t): t is number => t !== null && !isNaN(t));

    const avgResponseTime = responseTimes.length 
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;
    console.log(`Average response time: ${avgResponseTime}ms`);

    const statusDistribution = tickets.reduce((acc: Record<string, number>, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {});

    const metricsData = {
      timestamp: new Date(),
      openTickets,
      newTickets,
      slaBreachRate,
      avgResponseTime,
      statusDistribution,
      viewId
    };

    console.log(`Inserting metrics into database for view ${viewId}:`, metricsData);

    const result = await db.insert(metrics).values(metricsData);
    console.log(`Successfully inserted metrics for view ${viewId}`, result);

    return result;
  } catch (error) {
    console.error(`Failed to store metrics for view ${viewId}:`, error);
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    throw error; // Re-throw to be handled by the caller
  }
}

export function startWorker() {
  console.log("Starting metrics worker with 1-minute refresh interval...");
  console.log("Worker configuration:", {
    refreshInterval: REFRESH_INTERVAL,
    refreshIntervalMinutes: REFRESH_INTERVAL / 1000 / 60,
    timestamp: new Date().toISOString()
  });

  updateMetrics(); // Initial update
  setInterval(updateMetrics, REFRESH_INTERVAL);
}