import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { tickets, metrics } from "@db/schema";
import { startWorker } from "./worker";
import { eq, desc, and, gte } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  // Start background worker
  startWorker();

  // Middleware to check Zendesk credentials
  const checkZendeskCredentials = (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    if (!process.env.ZENDESK_DOMAIN || !process.env.ZENDESK_EMAIL || !process.env.ZENDESK_TOKEN) {
      return res.status(503).json({ message: "Zendesk credentials not configured" });
    }
    next();
  };

  // Get tickets with filters
  app.get("/api/tickets", checkZendeskCredentials, async (req, res) => {
    const { timeRange = "24h", status } = req.query;
    const timeFilter = new Date();

    switch(timeRange) {
      case "1h": timeFilter.setHours(timeFilter.getHours() - 1); break;
      case "4h": timeFilter.setHours(timeFilter.getHours() - 4); break;
      case "12h": timeFilter.setHours(timeFilter.getHours() - 12); break;
      case "7d": timeFilter.setDate(timeFilter.getDate() - 7); break;
      default: timeFilter.setHours(timeFilter.getHours() - 24);
    }

    const query = status 
      ? and(gte(tickets.createdAt, timeFilter), eq(tickets.status, status))
      : gte(tickets.createdAt, timeFilter);

    const results = await db.select().from(tickets)
      .where(query)
      .orderBy(desc(tickets.createdAt));

    res.json(results);
  });

  // Get metrics
  app.get("/api/metrics", checkZendeskCredentials, async (req, res) => {
    const { timeRange = "24h" } = req.query;
    const results = await db.select().from(metrics)
      .where(eq(metrics.timeRange, timeRange as string))
      .orderBy(desc(metrics.timestamp))
      .limit(1);

    res.json(results[0] || null);
  });

  // Get metrics history for trends
  app.get("/api/metrics/history", checkZendeskCredentials, async (req, res) => {
    const { timeRange = "24h" } = req.query;
    const results = await db.select().from(metrics)
      .where(eq(metrics.timeRange, timeRange as string))
      .orderBy(desc(metrics.timestamp))
      .limit(24);

    res.json(results);
  });

  return httpServer;
}