import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
export const entries = sqliteTable(
  "entries",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    day: text("day").notNull(),
    title: text("title").notNull().default(""),
    body: text("body").notNull().default(""),
    media: text("media").notNull().default("[]"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at"),
  },
  (t) => [index("entries_user_day").on(t.userId, t.day)],
);
export const moods = sqliteTable(
  "moods",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    day: text("day").notNull(),
    score: integer("score").notNull(),
  },
  (t) => [index("moods_user_day").on(t.userId, t.day)],
);
export const preferences = sqliteTable("preferences", {
  userId: text("user_id").primaryKey(),
  payload: text("payload").notNull().default("{}"),
});
export const messages = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    role: text("role").notNull(),
    content: text("content").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => [index("messages_user_time").on(t.userId, t.createdAt)],
);
export const usage = sqliteTable("chat_usage", {
  id: text("id").primaryKey(),
  count: integer("count").notNull().default(0),
});
