import { pgTable, text, jsonb, timestamp, primaryKey } from "drizzle-orm/pg-core";

/**
 * Generic JSONB store for all non-user collections.
 * Each row = one item in a named collection.
 */
export const itemsTable = pgTable("items", {
  collection: text("collection").notNull(),
  id: text("id").notNull(),
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  primaryKey({ name: "items_collection_id_pk", columns: [table.collection, table.id] }),
]);
