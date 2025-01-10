import { db } from "@db";
import { tickets, metrics } from "@db/schema";
import { fetchTickets } from "./zendesk";
import { eq } from "drizzle-orm";

const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

async function updateMetrics() {
  // Check if Zendesk credentials are available
  if (!process.env.ZENDESK_DOMAIN || !process.env.ZENDESK_EMAIL || !process.env.ZENDESK_TOKEN) {
    console.log("Zendesk credentials not configured. Skipping metrics update.");
    return;
  }

  const timeRanges = ["1h", "4h", "12h", "24h", "7d"];

  for (const timeRange of timeRanges) {
    try {
      const allTickets = await fetchTickets(timeRange);

      // Update tickets table
      for (const ticket of allTickets) {
        await db.insert(tickets).values(ticket)
          .onConflictDoUpdate({
            target: tickets.zendeskId,
            set: ticket
          });
      }

      // Calculate metrics
      const openTickets = allTickets.filter(t => t.status === "open").length;
      const newTickets = allTickets.filter(t => 
        new Date().getTime() - new Date(t.createdAt).getTime() < 24 * 60 * 60 * 1000
      ).length;

      const slaBreachCount = allTickets.filter(t => t.slaBreached).length;
      const slaBreachRate = allTickets.length ? Math.round((slaBreachCount / allTickets.length) * 100) : 0;

      const responseTimes = allTickets
        .map(t => t.firstResponseTime)
        .filter((t): t is number => t !== null);
      const avgResponseTime = responseTimes.length 
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0;

      const statusDistribution = allTickets.reduce((acc: Record<string, number>, t) => {
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
        timeRange
      });
    } catch (error) {
      console.error(`Error updating metrics for ${timeRange}:`, error);
    }
  }
}

export function startWorker() {
  updateMetrics(); // Initial update
  setInterval(updateMetrics, REFRESH_INTERVAL);
}