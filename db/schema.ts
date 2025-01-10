import { pgTable, text, serial, timestamp, integer, jsonb, boolean, bigint } from "drizzle-orm/pg-core";

export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  zendeskId: text("zendesk_id").notNull().unique(),
  status: text("status").notNull(),
  priority: text("priority"),
  subject: text("subject").notNull(),
  description: text("description"),
  assigneeId: text("assignee_id"),
  requesterId: text("requester_id").notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  firstResponseTime: integer("first_response_time"),
  resolutionTime: integer("resolution_time"),
  slaBreached: boolean("sla_breached").default(false),
  metadata: jsonb("metadata"),
  viewId: bigint("view_id", { mode: "number" })
});

export const metrics = pgTable("metrics", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").notNull(),
  openTickets: integer("open_tickets").notNull(),
  newTickets: integer("new_tickets").notNull(),
  slaBreachRate: integer("sla_breach_rate").notNull(),
  avgResponseTime: integer("avg_response_time").notNull(),
  statusDistribution: jsonb("status_distribution").notNull(),
  viewId: bigint("view_id", { mode: "number" })
});

export const views = pgTable("views", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  title: text("title").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
});

export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;
export type Metric = typeof metrics.$inferSelect;
export type NewMetric = typeof metrics.$inferInsert;
export type View = typeof views.$inferSelect;
export type NewView = typeof views.$inferInsert;