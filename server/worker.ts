import { db } from "@db";
import { tickets, metrics } from "@db/schema";
import { fetchTickets, fetchViews } from "./zendesk";
import { eq } from "drizzle-orm";

const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

async function updateMetrics() {
  // Check if Zendesk credentials are available
  if (!process.env.ZENDESK_DOMAIN || !process.env.ZENDESK_EMAIL || !process.env.ZENDESK_TOKEN) {
    console.log("Zendesk credentials not configured. Skipping metrics update.");
    return;
  }

  const timeRanges = ["1h", "4h", "12h", "24h", "7d"];

  try {
    // Fetch all views first
    const views = await fetchViews();

    // Process metrics for each time range
    for (const timeRange of timeRanges) {
      try {
        // First, process metrics for all tickets (no view filter)
        const allTickets = await fetchTickets(timeRange);
        await storeMetrics(allTickets, timeRange);

        // Then process metrics for each view
        for (const view of views) {
          const viewTickets = await fetchTickets(timeRange, view.id);
          await storeMetrics(viewTickets, timeRange, view.id);
        }
      } catch (error) {
        console.error(`Error updating metrics for ${timeRange}:`, error);
      }
    }
  } catch (error) {
    console.error("Error fetching views:", error);
  }
}

async function storeMetrics(tickets: any[], timeRange: string, viewId?: number) {
  const openTickets = tickets.filter(t => t.status === "open").length;
  const newTickets = tickets.filter(t => 
    new Date().getTime() - new Date(t.createdAt).getTime() < 24 * 60 * 60 * 1000
  ).length;

  const slaBreachCount = tickets.filter(t => t.slaBreached).length;
  const slaBreachRate = tickets.length ? Math.round((slaBreachCount / tickets.length) * 100) : 0;

  const responseTimes = tickets
    .map(t => t.firstResponseTime)
    .filter((t): t is number => t !== null);
  const avgResponseTime = responseTimes.length 
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : 0;

  const statusDistribution = tickets.reduce((acc: Record<string, number>, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  // Store metrics
  await db.insert(metrics).values({
    timestamp: new Date(),
    openTickets,
    newTickets,
    slaBreachRate,
    avgResponseTime,
    statusDistribution,
    timeRange,
    viewId: viewId || null
  });
}

export function startWorker() {
  updateMetrics(); // Initial update
  setInterval(updateMetrics, REFRESH_INTERVAL);
}