import { db } from "@db";
import { tickets, metrics, views } from "@db/schema";
import { fetchTickets } from "./zendesk";
import { eq } from "drizzle-orm";

const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

async function updateMetrics() {
  // Check if Zendesk credentials are available
  if (!process.env.ZENDESK_DOMAIN || !process.env.ZENDESK_EMAIL || !process.env.ZENDESK_TOKEN) {
    console.log("Zendesk credentials not configured. Skipping metrics update.");
    return;
  }

  try {
    // Get all enabled views
    const enabledViews = await db.select().from(views).where(eq(views.enabled, true));

    for (const view of enabledViews) {
      console.log(`Starting metrics update for view ${view.id}`);

      // Get current state of tickets in the view
      const viewTickets = await fetchTickets(view.id);

      try {
        await storeMetrics(viewTickets, view.id);
        console.log(`Successfully stored metrics for view ${view.id}`);
      } catch (error) {
        console.error(`Error updating metrics for view ${view.id}:`, error);
      }
    }
  } catch (error) {
    console.error("Error updating metrics:", error);
  }
}

async function storeMetrics(tickets: any[], viewId: number) {
  // Count tickets by their current state
  const openTickets = tickets.filter(t => t.status === "open" || t.status === "new").length;

  // Count tickets created in the last 24 hours as new
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const newTickets = tickets.filter(t => new Date(t.createdAt) >= last24Hours).length;

  const slaBreachCount = tickets.filter(t => t.slaBreached).length;
  const slaBreachRate = tickets.length ? Math.round((slaBreachCount / tickets.length) * 100) : 0;

  const responseTimes = tickets
    .map(t => t.firstResponseTime)
    .filter((t): t is number => t !== null && !isNaN(t));

  const avgResponseTime = responseTimes.length 
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : 0;

  const statusDistribution = tickets.reduce((acc: Record<string, number>, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  console.log(`Metrics calculated for view ${viewId}:`, {
    openTickets,
    newTickets,
    slaBreachRate,
    avgResponseTime,
    statusCount: Object.keys(statusDistribution).length,
    totalTickets: tickets.length
  });

  // Store metrics
  await db.insert(metrics).values({
    timestamp: new Date(),
    openTickets,
    newTickets,
    slaBreachRate,
    avgResponseTime,
    statusDistribution,
    viewId
  });
}

export function startWorker() {
  console.log("Starting metrics worker...");
  updateMetrics(); // Initial update
  setInterval(updateMetrics, REFRESH_INTERVAL);
}