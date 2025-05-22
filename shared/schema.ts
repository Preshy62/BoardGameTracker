import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, jsonb } from "drizzle-orm/pg-core";
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
  
  // Email verification fields
  emailVerified: boolean("email_verified").default(false),
  verificationToken: text("verification_token"),
  verificationTokenExpires: timestamp("verification_token_expires"),
  
  // Password reset fields
  resetPasswordToken: text("reset_password_token"),
  resetPasswordTokenExpires: timestamp("reset_password_token_expires"),
  
  // Email notification preferences
  emailNotifications: jsonb("email_notifications").default('{"transactions": true, "marketing": true, "gameUpdates": true}'),
  
  // Location and internationalization
  countryCode: text("country_code").default('NG'),
  preferredCurrency: text("preferred_currency").default('NGN'),
  language: text("language").default('en'),
  timeZone: text("time_zone"),
  
  // Bank account details for withdrawals
  bankDetails: jsonb("bank_details"),
  
  // KYC verification
  isVerified: boolean("is_verified").default(false),
  verificationLevel: integer("verification_level").default(0),
  
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
  
  // Currency information
  currency: text("currency").notNull().default('NGN'),
  conversionRate: doublePrecision("conversion_rate"),
  amountInUSD: doublePrecision("amount_in_usd"),
  
  // Transaction description
  description: text("description"),
  
  // Payment details
  paymentMethod: text("payment_method"),
  paymentDetails: jsonb("payment_details"),
  
  // For withdrawals
  withdrawalStatus: text("withdrawal_status"),
  withdrawalMethod: text("withdrawal_method"),
  bankDetails: jsonb("bank_details"),
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
  
  // Multi-winner support - storing JSON arrays of winners
  winnerIds: jsonb("winner_ids"), // Array of user IDs who won
  winningNumber: integer("winning_number"),
  
  // Game features
  voiceChatEnabled: boolean("voice_chat_enabled").default(false),
  textChatEnabled: boolean("text_chat_enabled").default(true),
  
  // Currency information
  currency: text("currency").default('NGN'),
  stakePot: doublePrecision("stake_pot").notNull(),
  
  // For international games
  region: text("region"),
  language: text("language").default('en'),
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  status: true,
  createdAt: true,
  endedAt: true,
  winnerIds: true,
  winningNumber: true,
  stakePot: true,
});

// GamePlayer model
export const gamePlayers = pgTable("game_players", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull().references(() => games.id),
  userId: integer("user_id").notNull().references(() => users.id),
  turnOrder: integer("turn_order").notNull(),
  
  // Rolling information
  rolledNumber: integer("rolled_number"),
  hasRolled: boolean("has_rolled").notNull().default(false),
  rollTimestamp: timestamp("roll_timestamp"),
  
  // Player status
  isWinner: boolean("is_winner").default(false),
  winShare: doublePrecision("win_share"), // For multiple winners splitting the pot
  
  // Player game info
  joinedAt: timestamp("joined_at").defaultNow(),
  lastActiveAt: timestamp("last_active_at"),
  disconnectedAt: timestamp("disconnected_at"),
  isActive: boolean("is_active").default(true),
  isReady: boolean("is_ready").default(false),
  
  // Player game settings
  isMuted: boolean("is_muted").default(false),
  voiceChatEnabled: boolean("voice_chat_enabled"),
  
  // Timeout handling
  hasTimedOut: boolean("has_timed_out").default(false),
  timeoutCount: integer("timeout_count").default(0),
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
export type TransactionType = 'deposit' | 'withdrawal' | 'winnings' | 'stake' | 'refund';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'disputed';
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

// Bot game settings
export const botGameSettings = pgTable("bot_game_settings", {
  id: serial("id").primaryKey(),
  dailyWinLimit: integer("daily_win_limit").notNull().default(20), // Default 20 wins per day
  minStake: doublePrecision("min_stake").notNull().default(500), // Default min 500 Naira
  maxStake: doublePrecision("max_stake").notNull().default(20000), // Default max 20,000 Naira
  platformFeePercent: doublePrecision("platform_fee_percent").notNull().default(5), // Default 5%
  winChancePercent: doublePrecision("win_chance_percent").notNull().default(25), // Default 25% to win
  doubleStoneMultiplier: doublePrecision("double_stone_multiplier").notNull().default(2), // Default 2x
  tripleStoneMultiplier: doublePrecision("triple_stone_multiplier").notNull().default(3), // Default 3x
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
});

export const botGameStatistics = pgTable("bot_game_statistics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull().defaultNow(),
  totalGamesPlayed: integer("total_games_played").notNull().default(0),
  totalWins: integer("total_wins").notNull().default(0),
  totalPayouts: doublePrecision("total_payouts").notNull().default(0),
  totalStakes: doublePrecision("total_stakes").notNull().default(0),
  platformFees: doublePrecision("platform_fees").notNull().default(0),
  pendingPayouts: doublePrecision("pending_payouts").notNull().default(0),
});

// Monthly lottery system for multiplayer games
export const monthlyLottery = pgTable("monthly_lottery", {
  id: serial("id").primaryKey(),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  lotteryDate: integer("lottery_date").notNull(), // Day of month (1-31)
  isActive: boolean("is_active").default(false),
  multiplier500: doublePrecision("multiplier_500").default(2.0), // 2x for 500
  multiplier1000: doublePrecision("multiplier_1000").default(3.0), // 3x for 1000
  announcementSent: boolean("announcement_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User notifications for lottery announcements
export const userNotifications = pgTable("user_notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // 'lottery', 'system', 'game', etc.
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
