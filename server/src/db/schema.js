import { mysqlTable, int, varchar, decimal, datetime, mysqlEnum, text } from "drizzle-orm/mysql-core";

export const clients = mysqlTable("clients", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }),
  phone: varchar("phone", { length: 20 }).notNull(),
});

export const roomTypes = mysqlTable("room_types", {
  typeId: varchar("type_id", { length: 10 }).primaryKey(),
  label: varchar("label", { length: 50 }).notNull(),
  baseRate: decimal("base_rate", { precision: 10, scale: 2 }).notNull(),
});

export const rooms = mysqlTable("rooms", {
  roomNumber: int("room_number").primaryKey(),
  typeId: varchar("type_id", { length: 10 }).notNull().references(() => roomTypes.typeId),
  status: mysqlEnum("status", ["available", "locked", "confirmed", "maintenance"]).default("available").notNull(),
});

export const reservations = mysqlTable("reservations", {
  resId: varchar("res_id", { length: 20 }).primaryKey(),
  clientId: int("client_id").notNull().references(() => clients.id),
  roomNumber: int("room_number").notNull().references(() => rooms.roomNumber),
  checkIn: datetime("check_in").notNull(),
  checkOut: datetime("check_out").notNull(),
  status: mysqlEnum("status", ["pending","locked","confirmed","checked_in","checked_out","no_show","cancelled","expired"]).default("pending").notNull(),
  depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }).default("0.00"),
  lockExpiry: datetime("lock_expiry"),
});

export const auditLog = mysqlTable("audit_log", {
  logId: int("log_id").primaryKey().autoincrement(),
  resId: varchar("res_id", { length: 20 }).notNull().references(() => reservations.resId),
  action: varchar("action", { length: 50 }).notNull(),
  oldData: text("old_data"),
  newData: text("new_data"),
  agentId: varchar("agent_id", { length: 50 }).notNull(),
  timestamp: datetime("timestamp").notNull(),
});
