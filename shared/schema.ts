import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  walletBalance: doublePrecision("wallet_balance").notNull().default(0),
  avatarInitials: text("avatar_initials").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  // Stripe fields for payment integration
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  walletBalance: true,
  createdAt: true,
  isAdmin: true,
  isActive: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
});

// Transaction model
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: doublePrecision("amount").notNull(),
  type: text("type").notNull(), // 'deposit', 'withdrawal', 'winnings', 'stake'
  status: text("status").notNull(), // 'pending', 'completed', 'failed'
  reference: text("reference").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

// Game model
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  maxPlayers: integer("max_players").notNull(),
  stake: doublePrecision("stake").notNull(),
  status: text("status").notNull(), // 'waiting', 'in_progress', 'completed'
  commissionPercentage: doublePrecision("commission_percentage").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  winnerId: integer("winner_id").references(() => users.id),
  winningNumber: integer("winning_number"),
  voiceChatEnabled: boolean("voice_chat_enabled").default(false),
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  status: true,
  createdAt: true,
  endedAt: true,
  winnerId: true,
  winningNumber: true,
});

// GamePlayer model
export const gamePlayers = pgTable("game_players", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull().references(() => games.id),
  userId: integer("user_id").notNull().references(() => users.id),
  turnOrder: integer("turn_order").notNull(),
  rolledNumber: integer("rolled_number"),
  hasRolled: boolean("has_rolled").notNull().default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const insertGamePlayerSchema = createInsertSchema(gamePlayers).omit({
  id: true,
  rolledNumber: true,
  hasRolled: true,
  joinedAt: true,
});

// Message model
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull().references(() => games.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  type: text("type").notNull().default('chat'), // 'chat', 'system'
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

// Types for inserting and selecting
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertGame = z.infer<typeof insertGameSchema> & {
  // These properties are not in the database schema but passed from client to server
  playWithBot?: boolean;
  voiceChatEnabled?: boolean;
};
export type Game = typeof games.$inferSelect;

export type InsertGamePlayer = z.infer<typeof insertGamePlayerSchema>;
export type GamePlayer = typeof gamePlayers.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Domain specific types
export type GameStatus = 'waiting' | 'in_progress' | 'completed';
export type TransactionType = 'deposit' | 'withdrawal' | 'winnings' | 'stake';
export type TransactionStatus = 'pending' | 'completed' | 'failed';
export type MessageType = 'chat' | 'system';

// WebSocket message types
export type WebSocketMessageType = 
  | 'join_game'
  | 'leave_game'
  | 'roll_stone'
  | 'chat_message'
  | 'game_update'
  | 'game_ended'
  | 'player_joined'
  | 'player_left'
  | 'turn_changed'
  | 'error'
  // Voice chat signaling messages
  | 'voice_offer'
  | 'voice_answer'
  | 'voice_ice_candidate'
  | 'voice_leave';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
}
