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

// Better Auth's credential and session tables are separate from journal data.
export const user = sqliteTable("member_user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .notNull()
    .default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  username: text("username").unique(),
  displayUsername: text("display_username"),
});
export const session = sqliteTable("member_session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});
export const account = sqliteTable("member_account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp_ms",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp_ms",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});
export const verification = sqliteTable("member_verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});
export const memberProfiles = sqliteTable("member_profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  storageId: text("storage_id").notNull().unique(),
  role: text("role").notNull().default("member"),
  recoveryHash: text("recovery_hash").notNull(),
  createdAt: text("created_at").notNull(),
});
export const memberInvites = sqliteTable("member_invite", {
  id: text("id").primaryKey(),
  codeHash: text("code_hash").notNull().unique(),
  label: text("label").notNull().default("朋友试用"),
  expiresAt: integer("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
  usedBy: text("used_by"),
  revoked: integer("revoked").notNull().default(0),
});
export const memberAttempts = sqliteTable("member_attempt", {
  id: text("id").primaryKey(),
  hits: integer("hits").notNull(),
  resetAt: integer("reset_at").notNull(),
});
