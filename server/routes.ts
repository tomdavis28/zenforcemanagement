import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { tickets, metrics, views } from "@db/schema";
import { startWorker } from "./worker";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import { fetchViews } from "./zendesk";

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

  // Get Zendesk views with their enabled status
  app.get("/api/views", checkZendeskCredentials, async (req, res) => {
    try {
      const zendeskViews = await fetchViews();
      const dbViews = await db.select().from(views);

      // Combine Zendesk views with enabled status from database
      const viewsWithStatus = zendeskViews.map(view => {
        const dbView = dbViews.find(v => v.id === view.id);
        return {
          ...view,
          enabled: dbView?.enabled ?? true
        };
      });

      res.json(viewsWithStatus);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch views" });
    }
  });

  // Toggle view enabled status
  app.post("/api/views/:id/toggle", checkZendeskCredentials, async (req, res) => {
    const viewId = parseInt(req.params.id);
    try {
      const existingView = await db.select().from(views).where(eq(views.id, viewId)).limit(1);

      if (existingView.length > 0) {
        await db.update(views)
          .set({ enabled: !existingView[0].enabled })
          .where(eq(views.id, viewId));
      } else {
        await db.insert(views).values({
          id: viewId,
          title: req.body.title || `View ${viewId}`,
          enabled: true
        });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle view status" });
    }
  });

  // Get tickets with filters (only from enabled views)
  app.get("/api/tickets", checkZendeskCredentials, async (req, res) => {
    const { viewId } = req.query;

    try {
      if (viewId) {
        const viewEnabled = await db.select()
          .from(views)
          .where(eq(views.id, parseInt(viewId as string)))
          .limit(1);

        if (viewEnabled.length === 0 || !viewEnabled[0].enabled) {
          return res.json([]);
        }
      }

      const results = await db.select()
        .from(tickets)
        .where(viewId ? eq(tickets.viewId, parseInt(viewId as string)) : undefined)
        .orderBy(desc(tickets.createdAt));

      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  // Get metrics (only from enabled views)
  app.get("/api/metrics", checkZendeskCredentials, async (req, res) => {
    const { viewId } = req.query;

    try {
      if (viewId) {
        const viewEnabled = await db.select()
          .from(views)
          .where(eq(views.id, parseInt(viewId as string)))
          .limit(1);

        if (viewEnabled.length === 0 || !viewEnabled[0].enabled) {
          return res.json(null);
        }
      }

      const results = await db.select()
        .from(metrics)
        .where(viewId ? eq(metrics.viewId, parseInt(viewId as string)) : undefined)
        .orderBy(desc(metrics.timestamp))
        .limit(1);

      res.json(results[0] || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  // Get metrics history for trends (no view filtering)
  app.get("/api/metrics/history", async (req, res) => {
    try {
      // Get metrics from the last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const results = await db.select()
        .from(metrics)
        .where(gte(metrics.timestamp, sevenDaysAgo))
        .orderBy(desc(metrics.timestamp));

      console.log('Metrics history query results:', {
        recordCount: results.length,
        timeRange: {
          start: oneDayAgo.toISOString(),
          end: new Date().toISOString()
        },
        firstRecord: results[0],
        lastRecord: results[results.length - 1]
      });

      res.json(results);
    } catch (error) {
      console.error("Error fetching metrics history:", error);
      res.status(500).json({ message: "Failed to fetch metrics history" });
    }
  });

  return httpServer;
}