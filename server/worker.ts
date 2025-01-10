import { db } from "@db";
import { tickets, metrics } from "@db/schema";
import { fetchTickets } from "./zendesk";
import { eq } from "drizzle-orm";

const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes
const DEFAULT_VIEW_ID = 10121949446044; // Specific view ID we're tracking

async function updateMetrics() {
  // Check if Zendesk credentials are available
  if (!process.env.ZENDESK_DOMAIN || !process.env.ZENDESK_EMAIL || !process.env.ZENDESK_TOKEN) {
    console.log("Zendesk credentials not configured. Skipping metrics update.");
    return;
  }

  const timeRanges = ["1h", "4h", "12h", "24h", "7d"];

  try {
    console.log(`Starting metrics update for view ${DEFAULT_VIEW_ID}`);

    // Process metrics for each time range
    for (const timeRange of timeRanges) {
      try {
        console.log(`Fetching tickets for time range: ${timeRange}`);
        const viewTickets = await fetchTickets(timeRange, DEFAULT_VIEW_ID);
        await storeMetrics(viewTickets, timeRange);
        console.log(`Successfully stored metrics for ${timeRange}`);
      } catch (error) {
        console.error(`Error updating metrics for ${timeRange}:`, error);
      }
    }
  } catch (error) {
    console.error("Error updating metrics:", error);
  }
}

async function storeMetrics(tickets: any[], timeRange: string) {
  const openTickets = tickets.filter(t => t.status === "open" || t.status === "new").length;
  const newTickets = tickets.filter(t => 
    new Date().getTime() - new Date(t.createdAt).getTime() < 24 * 60 * 60 * 1000
  ).length;

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

  console.log(`Metrics calculated for ${timeRange}:`, {
    openTickets,
    newTickets,
    slaBreachRate,
    avgResponseTime,
    statusCount: Object.keys(statusDistribution).length
  });

  // Store metrics
  await db.insert(metrics).values({
    timestamp: new Date(),
    openTickets,
    newTickets,
    slaBreachRate,
    avgResponseTime,
    statusDistribution,
    timeRange,
    viewId: DEFAULT_VIEW_ID
  });
}

export function startWorker() {
  console.log("Starting metrics worker...");
  updateMetrics(); // Initial update
  setInterval(updateMetrics, REFRESH_INTERVAL);
}