import { 
  users, User, InsertUser,
  games, Game, InsertGame,
  gamePlayers, GamePlayer, InsertGamePlayer,
  messages, Message, InsertMessage,
  transactions, Transaction, InsertTransaction,
  GameStatus
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, gte, and, inArray, sql } from "drizzle-orm";

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser & { avatarInitials: string }): Promise<User>;
  updateUserBalance(userId: number, newBalance: number): Promise<User>;
  updateUserProfile(userId: number, updates: Partial<User>): Promise<User>;
  updateUserBankDetails(userId: number, bankDetails: any): Promise<User>;
  deleteUser(userId: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  
  // Game operations
  getGame(id: number): Promise<Game | undefined>;
  getGames(): Promise<Game[]>;
  getGamesByStatus(status: GameStatus): Promise<Game[]>;
  getUserGames(userId: number): Promise<Game[]>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(gameId: number, updates: Partial<InsertGame>): Promise<Game>;
  updateGameStatus(gameId: number, status: GameStatus): Promise<Game>;
  updateGameWinners(gameId: number, winnerIds: number[], winningNumber: number): Promise<Game>;
  endGame(gameId: number): Promise<Game>;
  getAvailableGames(currency?: string, minStake?: number, maxStake?: number): Promise<Game[]>;
  
  // GamePlayer operations
  getGamePlayer(gameId: number, userId: number): Promise<GamePlayer | undefined>;
  getGamePlayers(gameId: number): Promise<(GamePlayer & { user: User })[]>;
  createGamePlayer(gamePlayer: InsertGamePlayer): Promise<GamePlayer>;
  updateGamePlayerRoll(gamePlayerId: number, rolledNumber: number): Promise<GamePlayer>;
  updateGamePlayerStatus(gamePlayerId: number, updates: Partial<GamePlayer>): Promise<GamePlayer>;
  markPlayerAsWinner(gameId: number, userId: number, winShare: number): Promise<GamePlayer>;
  getGameWinners(gameId: number): Promise<(GamePlayer & { user: User })[]>;
  
  // Message operations
  getGameMessages(gameId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  createWithdrawalRequest(userId: number, amount: number, currency: string, bankDetails: any): Promise<Transaction>;
  getTransaction(transactionId: number): Promise<Transaction | undefined>;
  updateTransactionStatus(transactionId: number, status: string, description?: string): Promise<Transaction>;
  
  // Currency operations
  convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<{amount: number, rate: number}>;
  
  // Admin operations
  getAllTransactions(): Promise<Transaction[]>;
  getGameStatistics(period: string): Promise<any>; // Returns game creation and completion statistics
  getFinancialStatistics(period: string): Promise<any>; // Returns financial data for dashboards
  getUserActivity(period: string): Promise<any>; // Returns user registration and activity data
  getTransactionSummary(period: string): Promise<any>; // Returns transaction summary by type and status
}

// In-memory implementation of the storage interface
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private games: Map<number, Game>;
  private gamePlayers: Map<number, GamePlayer>;
  private messages: Map<number, Message>;
  private transactions: Map<number, Transaction>;
  
  private currentUserId: number;
  private currentGameId: number;
  private currentGamePlayerId: number;
  private currentMessageId: number;
  private currentTransactionId: number;

  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.gamePlayers = new Map();
    this.messages = new Map();
    this.transactions = new Map();
    
    this.currentUserId = 1;
    this.currentGameId = 1;
    this.currentGamePlayerId = 1;
    this.currentMessageId = 1;
    this.currentTransactionId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser & { avatarInitials: string }): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      walletBalance: 0, 
      createdAt: now,
      isAdmin: false,
      isActive: true,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      
      // International fields
      countryCode: insertUser.countryCode || 'NG',
      preferredCurrency: insertUser.preferredCurrency || 'NGN',
      language: insertUser.language || 'en',
      timeZone: insertUser.timeZone || null,
      
      // Bank & verification
      bankDetails: null,
      isVerified: false,
      verificationLevel: 0
    };
    this.users.set(id, user);
    console.log('Created user in storage:', id, user.username);
    return user;
  }

  async updateUserBalance(userId: number, newBalance: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    const updatedUser = { ...user, walletBalance: newBalance };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async updateUserProfile(userId: number, updates: Partial<User>): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    const updatedUser = { ...user, ...updates };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async updateUserBankDetails(userId: number, bankDetails: any): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    const updatedUser = { ...user, bankDetails };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(userId: number): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) {
      return false; // User doesn't exist
    }
    
    // Delete user from memory
    this.users.delete(userId);
    
    // Delete user's game player records
    for (const [id, player] of this.gamePlayers.entries()) {
      if (player.userId === userId) {
        this.gamePlayers.delete(id);
      }
    }
    
    // Delete user's transactions
    for (const [id, transaction] of this.transactions.entries()) {
      if (transaction.userId === userId) {
        this.transactions.delete(id);
      }
    }
    
    return true;
  }

  // Game operations
  async getGame(id: number): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async getGames(): Promise<Game[]> {
    return Array.from(this.games.values());
  }

  async getGamesByStatus(status: GameStatus): Promise<Game[]> {
    return Array.from(this.games.values()).filter(
      (game) => game.status === status
    );
  }
  
  async getAvailableGames(currency?: string, minStake?: number, maxStake?: number): Promise<Game[]> {
    // Get all waiting games
    let availableGames = await this.getGamesByStatus('waiting');
    
    // Filter by currency if provided
    if (currency) {
      availableGames = availableGames.filter(game => game.currency === currency);
    }
    
    // Filter by min stake if provided
    if (minStake !== undefined) {
      availableGames = availableGames.filter(game => game.stake >= minStake);
    }
    
    // Filter by max stake if provided
    if (maxStake !== undefined) {
      availableGames = availableGames.filter(game => game.stake <= maxStake);
    }
    
    return availableGames;
  }

  async getUserGames(userId: number): Promise<Game[]> {
    // Get game IDs for games where user is a player
    const userGameIds = Array.from(this.gamePlayers.values())
      .filter(player => player.userId === userId)
      .map(player => player.gameId);
    
    // Get the games
    return Array.from(this.games.values()).filter(
      (game) => userGameIds.includes(game.id)
    );
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const id = this.currentGameId++;
    const now = new Date();
    const stakePot = insertGame.stake * insertGame.maxPlayers;
    
    const game: Game = {
      ...insertGame,
      id,
      status: "waiting",
      createdAt: now,
      endedAt: null,
      winnerIds: null,
      winningNumber: null,
      
      // Game features
      voiceChatEnabled: insertGame.voiceChatEnabled || false,
      textChatEnabled: true,
      
      // International settings
      currency: insertGame.currency || 'NGN',
      stakePot: stakePot,
      region: insertGame.region || null,
      language: insertGame.language || 'en'
    };
    this.games.set(id, game);
    return game;
  }
  
  async updateGame(gameId: number, updates: Partial<InsertGame>): Promise<Game> {
    const game = await this.getGame(gameId);
    if (!game) {
      throw new Error(`Game with ID ${gameId} not found`);
    }
    
    const updatedGame = { ...game, ...updates };
    this.games.set(gameId, updatedGame);
    return updatedGame;
  }

  async updateGameStatus(gameId: number, status: GameStatus): Promise<Game> {
    const game = await this.getGame(gameId);
    if (!game) {
      throw new Error(`Game with ID ${gameId} not found`);
    }
    
    const updatedGame = { ...game, status };
    this.games.set(gameId, updatedGame);
    return updatedGame;
  }

  async updateGameWinners(gameId: number, winnerIds: number[], winningNumber: number): Promise<Game> {
    const game = await this.getGame(gameId);
    if (!game) {
      throw new Error(`Game with ID ${gameId} not found`);
    }
    
    const updatedGame = { 
      ...game, 
      winnerIds, 
      winningNumber,
      status: "completed",
      endedAt: new Date()
    };
    this.games.set(gameId, updatedGame);
    return updatedGame;
  }
  
  // Keep for backward compatibility
  async updateGameWinner(gameId: number, winnerId: number, winningNumber: number): Promise<Game> {
    return this.updateGameWinners(gameId, [winnerId], winningNumber);
  }

  async endGame(gameId: number): Promise<Game> {
    const game = await this.getGame(gameId);
    if (!game) {
      throw new Error(`Game with ID ${gameId} not found`);
    }
    
    const updatedGame = { 
      ...game, 
      status: "completed",
      endedAt: new Date()
    };
    this.games.set(gameId, updatedGame);
    return updatedGame;
  }

  // GamePlayer operations
  async getGamePlayer(gameId: number, userId: number): Promise<GamePlayer | undefined> {
    return Array.from(this.gamePlayers.values()).find(
      (player) => player.gameId === gameId && player.userId === userId
    );
  }

  async getGamePlayers(gameId: number): Promise<(GamePlayer & { user: User })[]> {
    const players = Array.from(this.gamePlayers.values()).filter(
      (player) => player.gameId === gameId
    );
    
    return players.map((player) => {
      const user = this.users.get(player.userId);
      if (!user) {
        throw new Error(`User with ID ${player.userId} not found`);
      }
      return { ...player, user };
    }).sort((a, b) => a.turnOrder - b.turnOrder); // Sort by turn order
  }

  async createGamePlayer(insertGamePlayer: InsertGamePlayer): Promise<GamePlayer> {
    const id = this.currentGamePlayerId++;
    const now = new Date();
    const gamePlayer: GamePlayer = {
      ...insertGamePlayer,
      id,
      
      // Rolling information
      rolledNumber: null,
      hasRolled: false,
      rollTimestamp: null,
      
      // Player status
      isWinner: false,
      winShare: null,
      
      // Player game info
      joinedAt: now,
      lastActiveAt: now,
      disconnectedAt: null,
      isActive: true,
      isReady: false,
      
      // Player game settings
      isMuted: false,
      voiceChatEnabled: false,
      
      // Timeout handling
      hasTimedOut: false,
      timeoutCount: 0
    };
    this.gamePlayers.set(id, gamePlayer);
    return gamePlayer;
  }

  async updateGamePlayerRoll(gamePlayerId: number, rolledNumber: number): Promise<GamePlayer> {
    // Find the game player by ID
    let gamePlayer: GamePlayer | undefined;
    
    for (const [id, player] of this.gamePlayers.entries()) {
      if (player.id === gamePlayerId) {
        gamePlayer = player;
        break;
      }
    }
    
    if (!gamePlayer) {
      throw new Error(`GamePlayer with ID ${gamePlayerId} not found`);
    }
    
    const now = new Date();
    const updatedGamePlayer = { 
      ...gamePlayer, 
      rolledNumber, 
      hasRolled: true,
      rollTimestamp: now,
      lastActiveAt: now
    };
    this.gamePlayers.set(gamePlayer.id, updatedGamePlayer);
    return updatedGamePlayer;
  }
  
  async updateGamePlayerStatus(gamePlayerId: number, updates: Partial<GamePlayer>): Promise<GamePlayer> {
    // Find the game player by ID
    let gamePlayer: GamePlayer | undefined;
    
    for (const [id, player] of this.gamePlayers.entries()) {
      if (player.id === gamePlayerId) {
        gamePlayer = player;
        break;
      }
    }
    
    if (!gamePlayer) {
      throw new Error(`GamePlayer with ID ${gamePlayerId} not found`);
    }
    
    const updatedGamePlayer = { 
      ...gamePlayer,
      ...updates,
      lastActiveAt: new Date()
    };
    this.gamePlayers.set(gamePlayer.id, updatedGamePlayer);
    return updatedGamePlayer;
  }
  
  async markPlayerAsWinner(gameId: number, userId: number, winShare: number): Promise<GamePlayer> {
    const gamePlayer = await this.getGamePlayer(gameId, userId);
    if (!gamePlayer) {
      throw new Error(`GamePlayer for game ${gameId} and user ${userId} not found`);
    }
    
    const updatedGamePlayer = { 
      ...gamePlayer,
      isWinner: true,
      winShare
    };
    this.gamePlayers.set(gamePlayer.id, updatedGamePlayer);
    return updatedGamePlayer;
  }
  
  async getGameWinners(gameId: number): Promise<(GamePlayer & { user: User })[]> {
    const players = await this.getGamePlayers(gameId);
    return players.filter(player => player.isWinner);
  }

  // Message operations
  async getGameMessages(gameId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((message) => message.gameId === gameId)
      .sort((a, b) => {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const now = new Date();
    const message: Message = {
      ...insertMessage,
      id,
      createdAt: now
    };
    this.messages.set(id, message);
    return message;
  }

  // Transaction operations
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const now = new Date();
    
    // Set default values for new fields
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      createdAt: now,
      
      // Set default values for new fields if not provided
      currency: insertTransaction.currency || 'NGN',
      conversionRate: insertTransaction.conversionRate || null,
      amountInUSD: insertTransaction.amountInUSD || null,
      description: insertTransaction.description || null,
      
      // Payment details
      paymentMethod: insertTransaction.paymentMethod || null,
      paymentDetails: insertTransaction.paymentDetails || null,
      
      // Withdrawal details
      withdrawalStatus: insertTransaction.withdrawalStatus || null,
      withdrawalMethod: insertTransaction.withdrawalMethod || null,
      bankDetails: insertTransaction.bankDetails || null
    };
    
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter((transaction) => transaction.userId === userId)
      .sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }
  
  async getTransaction(transactionId: number): Promise<Transaction | undefined> {
    return this.transactions.get(transactionId);
  }
  
  async updateTransactionStatus(transactionId: number, status: string, description?: string): Promise<Transaction> {
    const transaction = await this.getTransaction(transactionId);
    if (!transaction) {
      throw new Error(`Transaction with ID ${transactionId} not found`);
    }
    
    const updatedTransaction = { 
      ...transaction, 
      status,
      ...(description ? { description } : {})
    };
    
    this.transactions.set(transactionId, updatedTransaction);
    return updatedTransaction;
  }
  
  async createWithdrawalRequest(
    userId: number, 
    amount: number, 
    currency: string, 
    bankDetails: any
  ): Promise<Transaction> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    const reference = `WIT-${Date.now()}-${userId}-${Math.floor(Math.random() * 1000)}`;
    
    return this.createTransaction({
      userId,
      amount,
      type: 'withdrawal',
      status: 'pending',
      reference,
      currency,
      bankDetails,
      withdrawalStatus: 'pending',
      withdrawalMethod: 'bank_transfer'
    });
  }
  
  async convertCurrency(
    amount: number, 
    fromCurrency: string, 
    toCurrency: string
  ): Promise<{amount: number, rate: number}> {
    // Simplified exchange rate table
    const rates: Record<string, Record<string, number>> = {
      'NGN': { 'USD': 0.00066, 'EUR': 0.00060, 'GBP': 0.00052 },
      'USD': { 'NGN': 1515.00, 'EUR': 0.91, 'GBP': 0.79 },
      'EUR': { 'NGN': 1655.00, 'USD': 1.10, 'GBP': 0.86 },
      'GBP': { 'NGN': 1925.00, 'USD': 1.27, 'EUR': 1.16 }
    };
    
    // If same currency, no conversion needed
    if (fromCurrency === toCurrency) {
      return { amount, rate: 1 };
    }
    
    // Get exchange rate
    const rate = rates[fromCurrency]?.[toCurrency];
    if (!rate) {
      throw new Error(`Exchange rate for ${fromCurrency} to ${toCurrency} not available`);
    }
    
    const convertedAmount = amount * rate;
    return {
      amount: convertedAmount,
      rate
    };
  }
}

// DatabaseStorage implementation
import { eq, and } from "drizzle-orm";
import { db } from "./db";

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    const allUsers = await db.select().from(users);
    return allUsers;
  }

  async createUser(insertUser: InsertUser & { avatarInitials: string }): Promise<User> {
    const now = new Date();
    const [user] = await db.insert(users).values({
      ...insertUser,
      walletBalance: 0,
      createdAt: now,
      isAdmin: false,
      isActive: true,
      countryCode: insertUser.countryCode || 'NG',
      preferredCurrency: insertUser.preferredCurrency || 'NGN',
      language: insertUser.language || 'en',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      isVerified: false,
      verificationLevel: 0,
      bankDetails: null
    }).returning();
    
    console.log('Created user in database:', user.id, user.username);
    return user;
  }

  async updateUserBalance(userId: number, newBalance: number): Promise<User> {
    const [updatedUser] = await db.update(users)
      .set({ walletBalance: newBalance })
      .where(eq(users.id, userId))
      .returning();
      
    if (!updatedUser) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    return updatedUser;
  }

  async updateUserProfile(userId: number, updates: Partial<User>): Promise<User> {
    const [updatedUser] = await db.update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();
      
    if (!updatedUser) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    return updatedUser;
  }

  async updateUserBankDetails(userId: number, bankDetails: any): Promise<User> {
    const [updatedUser] = await db.update(users)
      .set({ bankDetails })
      .where(eq(users.id, userId))
      .returning();
      
    if (!updatedUser) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    return updatedUser;
  }
  
  async deleteUser(userId: number): Promise<boolean> {
    try {
      // Delete user's game player records first to maintain referential integrity
      await db.delete(gamePlayers)
        .where(eq(gamePlayers.userId, userId));
      
      // Delete the user
      const result = await db.delete(users)
        .where(eq(users.id, userId));
      
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  // Game operations
  async getGame(id: number): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game;
  }

  async getGames(): Promise<Game[]> {
    return await db.select().from(games);
  }

  async getGamesByStatus(status: GameStatus): Promise<Game[]> {
    return await db.select().from(games).where(eq(games.status, status));
  }

  async getAvailableGames(currency?: string, minStake?: number, maxStake?: number): Promise<Game[]> {
    let query = db.select().from(games).where(eq(games.status, 'waiting'));
    
    if (currency) {
      query = query.where(eq(games.currency, currency));
    }
    
    if (minStake !== undefined && maxStake !== undefined) {
      // Both min and max defined
      query = query.where(
        and(
          eq(games.stake, minStake), 
          eq(games.stake, maxStake)
        )
      );
    } else if (minStake !== undefined) {
      // Only min defined
      query = query.where(eq(games.stake, minStake));
    } else if (maxStake !== undefined) {
      // Only max defined
      query = query.where(eq(games.stake, maxStake));
    }
    
    return await query;
  }

  async getUserGames(userId: number): Promise<Game[]> {
    // First get all game IDs where user is a player
    const playerGames = await db.select({ gameId: gamePlayers.gameId })
      .from(gamePlayers)
      .where(eq(gamePlayers.userId, userId));
    
    if (playerGames.length === 0) {
      return [];
    }
    
    // Get all those games
    const gameIds = playerGames.map(pg => pg.gameId);
    return await db.select().from(games).where(
      // Using SQL in syntax since we need an IN clause
      games.id in gameIds
    );
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const now = new Date();
    const stakePot = insertGame.stake * insertGame.maxPlayers;
    
    const [game] = await db.insert(games).values({
      ...insertGame,
      status: "waiting",
      createdAt: now,
      endedAt: null,
      winnerIds: null,
      winningNumber: null,
      voiceChatEnabled: insertGame.voiceChatEnabled || false,
      textChatEnabled: true,
      currency: insertGame.currency || 'NGN',
      stakePot,
      region: insertGame.region || null,
      language: insertGame.language || 'en'
    }).returning();
    
    return game;
  }

  async updateGame(gameId: number, updates: Partial<InsertGame>): Promise<Game> {
    const [updatedGame] = await db.update(games)
      .set(updates)
      .where(eq(games.id, gameId))
      .returning();
      
    if (!updatedGame) {
      throw new Error(`Game with ID ${gameId} not found`);
    }
    
    return updatedGame;
  }

  async updateGameStatus(gameId: number, status: GameStatus): Promise<Game> {
    const [updatedGame] = await db.update(games)
      .set({ status })
      .where(eq(games.id, gameId))
      .returning();
      
    if (!updatedGame) {
      throw new Error(`Game with ID ${gameId} not found`);
    }
    
    return updatedGame;
  }

  async updateGameWinners(gameId: number, winnerIds: number[], winningNumber: number): Promise<Game> {
    const [updatedGame] = await db.update(games)
      .set({ 
        winnerIds, 
        winningNumber,
        status: "completed",
        endedAt: new Date()
      })
      .where(eq(games.id, gameId))
      .returning();
      
    if (!updatedGame) {
      throw new Error(`Game with ID ${gameId} not found`);
    }
    
    return updatedGame;
  }

  async endGame(gameId: number): Promise<Game> {
    const [updatedGame] = await db.update(games)
      .set({ 
        status: "completed",
        endedAt: new Date()
      })
      .where(eq(games.id, gameId))
      .returning();
      
    if (!updatedGame) {
      throw new Error(`Game with ID ${gameId} not found`);
    }
    
    return updatedGame;
  }

  // GamePlayer operations
  async getGamePlayer(gameId: number, userId: number): Promise<GamePlayer | undefined> {
    const [gamePlayer] = await db.select()
      .from(gamePlayers)
      .where(
        and(
          eq(gamePlayers.gameId, gameId),
          eq(gamePlayers.userId, userId)
        )
      );
      
    return gamePlayer;
  }

  async getGamePlayers(gameId: number): Promise<(GamePlayer & { user: User })[]> {
    // This is more complex in SQL - need a join
    const players = await db.select({
      ...gamePlayers,
      user: users
    })
    .from(gamePlayers)
    .where(eq(gamePlayers.gameId, gameId))
    .innerJoin(users, eq(gamePlayers.userId, users.id))
    .orderBy(gamePlayers.turnOrder);
    
    return players.map(p => ({
      ...p,
      // Restructure to match expected interface
      user: p.user
    }));
  }

  async createGamePlayer(insertGamePlayer: InsertGamePlayer): Promise<GamePlayer> {
    const now = new Date();
    
    const [gamePlayer] = await db.insert(gamePlayers).values({
      ...insertGamePlayer,
      rolledNumber: null,
      hasRolled: false,
      rollTimestamp: null,
      isWinner: false,
      winShare: null,
      joinedAt: now,
      lastActiveAt: now,
      disconnectedAt: null,
      isActive: true,
      isReady: false,
      isMuted: false,
      voiceChatEnabled: false,
      hasTimedOut: false,
      timeoutCount: 0
    }).returning();
    
    return gamePlayer;
  }

  async updateGamePlayerRoll(gamePlayerId: number, rolledNumber: number): Promise<GamePlayer> {
    const now = new Date();
    
    const [updatedGamePlayer] = await db.update(gamePlayers)
      .set({ 
        rolledNumber, 
        hasRolled: true,
        rollTimestamp: now,
        lastActiveAt: now
      })
      .where(eq(gamePlayers.id, gamePlayerId))
      .returning();
      
    if (!updatedGamePlayer) {
      throw new Error(`GamePlayer with ID ${gamePlayerId} not found`);
    }
    
    return updatedGamePlayer;
  }

  async updateGamePlayerStatus(gamePlayerId: number, updates: Partial<GamePlayer>): Promise<GamePlayer> {
    const [updatedGamePlayer] = await db.update(gamePlayers)
      .set({ 
        ...updates,
        lastActiveAt: new Date()
      })
      .where(eq(gamePlayers.id, gamePlayerId))
      .returning();
      
    if (!updatedGamePlayer) {
      throw new Error(`GamePlayer with ID ${gamePlayerId} not found`);
    }
    
    return updatedGamePlayer;
  }

  async markPlayerAsWinner(gameId: number, userId: number, winShare: number): Promise<GamePlayer> {
    const [gamePlayer] = await db.select()
      .from(gamePlayers)
      .where(
        and(
          eq(gamePlayers.gameId, gameId),
          eq(gamePlayers.userId, userId)
        )
      );
      
    if (!gamePlayer) {
      throw new Error(`GamePlayer for game ${gameId} and user ${userId} not found`);
    }
    
    const [updatedGamePlayer] = await db.update(gamePlayers)
      .set({ 
        isWinner: true,
        winShare
      })
      .where(eq(gamePlayers.id, gamePlayer.id))
      .returning();
      
    return updatedGamePlayer;
  }

  async getGameWinners(gameId: number): Promise<(GamePlayer & { user: User })[]> {
    const players = await db.select({
      ...gamePlayers,
      user: users
    })
    .from(gamePlayers)
    .where(
      and(
        eq(gamePlayers.gameId, gameId),
        eq(gamePlayers.isWinner, true)
      )
    )
    .innerJoin(users, eq(gamePlayers.userId, users.id));
    
    return players.map(p => ({
      ...p,
      user: p.user
    }));
  }

  // Message operations
  async getGameMessages(gameId: number): Promise<Message[]> {
    return await db.select()
      .from(messages)
      .where(eq(messages.gameId, gameId))
      .orderBy(messages.createdAt);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values({
      ...insertMessage,
      createdAt: new Date()
    }).returning();
    
    return message;
  }

  // Transaction operations
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values({
      ...insertTransaction,
      createdAt: new Date(),
      currency: insertTransaction.currency || 'NGN',
      conversionRate: insertTransaction.conversionRate || null,
      amountInUSD: insertTransaction.amountInUSD || null,
      paymentMethod: insertTransaction.paymentMethod || null,
      paymentDetails: insertTransaction.paymentDetails || null,
      withdrawalStatus: insertTransaction.withdrawalStatus || null,
      withdrawalMethod: insertTransaction.withdrawalMethod || null,
      bankDetails: insertTransaction.bankDetails || null
    }).returning();
    
    return transaction;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return await db.select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(transactions.createdAt, 'desc');
  }

  async getTransaction(transactionId: number): Promise<Transaction | undefined> {
    const [transaction] = await db.select()
      .from(transactions)
      .where(eq(transactions.id, transactionId));
      
    return transaction;
  }

  async updateTransactionStatus(transactionId: number, status: string, description?: string): Promise<Transaction> {
    // Create update data with optional description
    const updateData: Record<string, string> = { status };
    if (description) {
      updateData.description = description;
    }
    
    // Update the transaction
    const [updatedTransaction] = await db.update(transactions)
      .set(updateData)
      .where(eq(transactions.id, transactionId))
      .returning();
      
    if (!updatedTransaction) {
      throw new Error(`Transaction with ID ${transactionId} not found`);
    }
    
    return updatedTransaction;
  }

  async createWithdrawalRequest(userId: number, amount: number, currency: string, bankDetails: any): Promise<Transaction> {
    const reference = `WITHDRAWAL-${Date.now()}-${userId}`;
    
    // Get bank name or account details for the description
    const bankName = bankDetails?.bankName || "bank account";
    const description = `Withdrawal to ${bankName}`;
    
    const [transaction] = await db.insert(transactions).values({
      userId,
      amount,
      type: "withdrawal",
      status: "pending",
      reference,
      currency,
      description,
      withdrawalStatus: "pending",
      withdrawalMethod: "bank_transfer",
      bankDetails
    }).returning();
    
    return transaction;
  }

  async convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<{ amount: number, rate: number }> {
    try {
      // If currencies are the same, return the original amount with rate of 1
      if (fromCurrency === toCurrency) {
        return {
          amount,
          rate: 1
        };
      }
      
      // Define base exchange rates in relation to NGN
      // These would ideally come from an external API like Open Exchange Rates, Fixer.io, CurrencyLayer, etc.
      // For now, we'll use a more comprehensive mapping with more currency pairs
      const baseRates: Record<string, number> = {
        // NGN base rates (1 NGN to X)
        'NGN_USD': 0.00066,  // 1 NGN = 0.00066 USD
        'NGN_EUR': 0.00061,  // 1 NGN = 0.00061 EUR
        'NGN_GBP': 0.00051,  // 1 NGN = 0.00051 GBP
        'NGN_ZAR': 0.012,    // 1 NGN = 0.012 ZAR
        'NGN_GHS': 0.0086,   // 1 NGN = 0.0086 GHS
        'NGN_KES': 0.088,    // 1 NGN = 0.088 KES
        'NGN_SLL': 0.014,    // 1 NGN = 0.014 SLL
        'NGN_CAD': 0.00089,  // 1 NGN = 0.00089 CAD
        'NGN_AUD': 0.00098,  // 1 NGN = 0.00098 AUD
        'NGN_JPY': 0.10,     // 1 NGN = 0.10 JPY
        'NGN_INR': 0.055,    // 1 NGN = 0.055 INR
        'NGN_BRL': 0.0034,   // 1 NGN = 0.0034 BRL
        'NGN_RUB': 0.062,    // 1 NGN = 0.062 RUB
        
        // USD base rates (1 USD to X)
        'USD_NGN': 1515.00,  // 1 USD = 1515 NGN
        'USD_EUR': 0.92,     // 1 USD = 0.92 EUR
        'USD_GBP': 0.78,     // 1 USD = 0.78 GBP
        
        // EUR base rates (1 EUR to X)
        'EUR_NGN': 1640.00,  // 1 EUR = 1640 NGN
        'EUR_USD': 1.09,     // 1 EUR = 1.09 USD
        'EUR_GBP': 0.85,     // 1 EUR = 0.85 GBP
        
        // GBP base rates (1 GBP to X)
        'GBP_NGN': 1950.00,  // 1 GBP = 1950 NGN
        'GBP_USD': 1.29,     // 1 GBP = 1.29 USD
        'GBP_EUR': 1.18,     // 1 GBP = 1.18 EUR
      };
      
      // Check for direct conversion rate
      const directKey = `${fromCurrency}_${toCurrency}`;
      if (baseRates[directKey]) {
        const rate = baseRates[directKey];
        return {
          amount: amount * rate,
          rate
        };
      }
      
      // If no direct conversion is available, try to convert through NGN
      // First convert from source currency to NGN if not already NGN
      let amountInNGN = amount;
      if (fromCurrency !== 'NGN') {
        const toNGNKey = `${fromCurrency}_NGN`;
        if (!baseRates[toNGNKey]) {
          // If we can't convert to NGN directly, handle the error
          throw new Error(`No conversion rate available from ${fromCurrency} to NGN`);
        }
        amountInNGN = amount * baseRates[toNGNKey];
      }
      
      // Then convert from NGN to target currency if not already NGN
      let finalAmount = amountInNGN;
      let effectiveRate = 1;
      
      if (toCurrency !== 'NGN') {
        const fromNGNKey = `NGN_${toCurrency}`;
        if (!baseRates[fromNGNKey]) {
          console.warn(`No conversion rate available from NGN to ${toCurrency}, using approximation`);
          // Use approximate fallback rates if specific rate is not available
          // Based on USD equivalents (1 unit of currency ≈ X USD)
          const fallbackRatesViaUSD: Record<string, number> = {
            'ZAR': 0.055,   // 1 ZAR ≈ 0.055 USD
            'GHS': 0.077,   // 1 GHS ≈ 0.077 USD
            'KES': 0.0077,  // 1 KES ≈ 0.0077 USD
            'SLL': 0.044,   // 1 SLL ≈ 0.044 USD
            'CAD': 0.74,    // 1 CAD ≈ 0.74 USD
            'AUD': 0.67,    // 1 AUD ≈ 0.67 USD
            'JPY': 0.0066,  // 1 JPY ≈ 0.0066 USD
            'INR': 0.012,   // 1 INR ≈ 0.012 USD
            'BRL': 0.19,    // 1 BRL ≈ 0.19 USD
            'RUB': 0.011,   // 1 RUB ≈ 0.011 USD
          };
          
          if (fallbackRatesViaUSD[toCurrency]) {
            // First convert NGN to USD
            const ngnToUsd = baseRates['NGN_USD'];
            // Then convert USD to target currency using fallback rates
            const usdAmount = amountInNGN * ngnToUsd;
            finalAmount = usdAmount / fallbackRatesViaUSD[toCurrency];
            // Calculate effective rate
            effectiveRate = finalAmount / amount;
          } else {
            // If all else fails, use 1:1 as last resort
            finalAmount = amountInNGN;
            effectiveRate = amountInNGN / amount;
          }
        } else {
          finalAmount = amountInNGN * baseRates[fromNGNKey];
          // Calculate effective rate from original currency to target
          effectiveRate = finalAmount / amount;
        }
      } else {
        // If target is NGN, calculate the rate differently
        effectiveRate = amountInNGN / amount;
      }
      
      // Add random fluctuation (+/- 0.5%) to simulate changing exchange rates
      const fluctuation = 1 + (Math.random() * 0.01 - 0.005);
      finalAmount = finalAmount * fluctuation;
      effectiveRate = effectiveRate * fluctuation;
      
      return {
        amount: finalAmount,
        rate: effectiveRate
      };
    } catch (error) {
      console.error('Error converting currency:', error);
      // Fallback to a direct conversion or estimate if all else fails
      const key = `${fromCurrency}_${toCurrency}`;
      const fallbackRates: Record<string, number> = {
        // Basic rates
        'NGN_USD': 0.00066,
        'USD_NGN': 1515.00,
        'GBP_NGN': 1950.00,
        'EUR_NGN': 1640.00,
        
        // Added fallback rates for new currencies
        'NGN_ZAR': 0.012,
        'NGN_GHS': 0.0086,
        'NGN_KES': 0.088,
        'NGN_SLL': 0.014,
        'NGN_CAD': 0.00089,
        'NGN_AUD': 0.00098,
        'NGN_JPY': 0.10,
        'NGN_INR': 0.055,
        'NGN_BRL': 0.0034,
        'NGN_RUB': 0.062,
        
        // Opposite direction
        'ZAR_NGN': 83.33,
        'GHS_NGN': 116.28,
        'KES_NGN': 11.36,
        'SLL_NGN': 71.43,
        'CAD_NGN': 1123.60,
        'AUD_NGN': 1020.41,
        'JPY_NGN': 10.00,
        'INR_NGN': 18.18,
        'BRL_NGN': 294.12,
        'RUB_NGN': 16.13,
      };
      
      // Try to get direct fallback rate
      let fallbackRate = fallbackRates[key];
      
      // If no direct fallback rate, try to get via USD
      if (!fallbackRate && fromCurrency !== 'USD' && toCurrency !== 'USD') {
        const fromToUsd = fallbackRates[`${fromCurrency}_USD`] || 
                          (baseRates[`${fromCurrency}_USD`] || (1/baseRates[`USD_${fromCurrency}`]));
        const usdToTarget = fallbackRates[`USD_${toCurrency}`] || 
                           (baseRates[`USD_${toCurrency}`] || (1/baseRates[`${toCurrency}_USD`]));
        
        if (fromToUsd && usdToTarget) {
          fallbackRate = fromToUsd * usdToTarget;
        }
      }
      
      // If still no rate, use 1:1 as absolute last resort
      fallbackRate = fallbackRate || 1;
      
      return {
        amount: amount * fallbackRate,
        rate: fallbackRate
      };
    }
  }
  
  // Admin dashboard methods
  async getAllTransactions(): Promise<Transaction[]> {
    try {
      const allTransactions = await db.select().from(transactions).orderBy(desc(transactions.createdAt));
      return allTransactions;
    } catch (error) {
      console.error("Error fetching all transactions:", error);
      return [];
    }
  }
  
  async getGameStatistics(period: string): Promise<any> {
    try {
      // Calculate date range based on period
      const today = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'day':
          startDate.setDate(today.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(today.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(today.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(today.getFullYear() - 1);
          break;
        default:
          startDate.setDate(today.getDate() - 7); // Default to week
      }
      
      // Get games created in period
      const gamesInPeriod = await db.select().from(games)
        .where(gte(games.createdAt, startDate));
      
      // Calculate statistics
      const totalGames = gamesInPeriod.length;
      const gamesWaiting = gamesInPeriod.filter(g => g.status === 'waiting').length;
      const gamesInProgress = gamesInPeriod.filter(g => g.status === 'in_progress').length;
      const gamesCompleted = gamesInPeriod.filter(g => g.status === 'completed').length;
      
      // Group games by day for chart data
      const gamesByDay: Record<string, number> = {};
      
      // Initialize all days in the period with 0 games
      for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        gamesByDay[dateStr] = 0;
      }
      
      // Count games per day
      gamesInPeriod.forEach(game => {
        const dateStr = new Date(game.createdAt).toISOString().split('T')[0];
        gamesByDay[dateStr] = (gamesByDay[dateStr] || 0) + 1;
      });
      
      // Format for chart data
      const chartData = Object.entries(gamesByDay).map(([date, count]) => ({
        date,
        count
      }));
      
      return {
        totalGames,
        gamesWaiting,
        gamesInProgress,
        gamesCompleted,
        chartData,
        period
      };
    } catch (error) {
      console.error("Error getting game statistics:", error);
      return {
        totalGames: 0,
        gamesWaiting: 0,
        gamesInProgress: 0,
        gamesCompleted: 0,
        chartData: [],
        period
      };
    }
  }
  
  async getFinancialStatistics(period: string): Promise<any> {
    try {
      // Calculate date range based on period
      const today = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'day':
          startDate.setDate(today.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(today.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(today.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(today.getFullYear() - 1);
          break;
        default:
          startDate.setDate(today.getDate() - 7); // Default to week
      }
      
      // Get transactions in period
      const transactionsInPeriod = await db.select().from(transactions)
        .where(gte(transactions.createdAt, startDate));
      
      // Calculate financial metrics
      const totalDeposits = transactionsInPeriod
        .filter(t => t.type === 'deposit' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);
        
      const totalWithdrawals = transactionsInPeriod
        .filter(t => t.type === 'withdrawal' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);
        
      const totalFees = transactionsInPeriod
        .filter(t => t.type === 'commission' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);
        
      const totalGameStakes = transactionsInPeriod
        .filter(t => t.type === 'stake' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);
        
      const totalGameWinnings = transactionsInPeriod
        .filter(t => t.type === 'winnings' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);
      
      // Group transactions by day for chart data
      const depositsByDay: Record<string, number> = {};
      const withdrawalsByDay: Record<string, number> = {};
      const feesByDay: Record<string, number> = {};
      
      // Initialize all days in the period
      for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        depositsByDay[dateStr] = 0;
        withdrawalsByDay[dateStr] = 0;
        feesByDay[dateStr] = 0;
      }
      
      // Calculate daily totals
      transactionsInPeriod.forEach(tx => {
        if (tx.status !== 'completed') return;
        
        const dateStr = new Date(tx.createdAt).toISOString().split('T')[0];
        
        if (tx.type === 'deposit') {
          depositsByDay[dateStr] = (depositsByDay[dateStr] || 0) + tx.amount;
        } else if (tx.type === 'withdrawal') {
          withdrawalsByDay[dateStr] = (withdrawalsByDay[dateStr] || 0) + tx.amount;
        } else if (tx.type === 'commission') {
          feesByDay[dateStr] = (feesByDay[dateStr] || 0) + tx.amount;
        }
      });
      
      // Format for chart data
      const chartData = Object.keys(depositsByDay).map(date => ({
        date,
        deposits: depositsByDay[date] || 0,
        withdrawals: withdrawalsByDay[date] || 0,
        fees: feesByDay[date] || 0
      }));
      
      return {
        totalDeposits,
        totalWithdrawals,
        totalFees,
        totalGameStakes,
        totalGameWinnings,
        netRevenue: totalDeposits - totalWithdrawals + totalFees,
        chartData,
        period
      };
    } catch (error) {
      console.error("Error getting financial statistics:", error);
      return {
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalFees: 0,
        totalGameStakes: 0,
        totalGameWinnings: 0,
        netRevenue: 0,
        chartData: [],
        period
      };
    }
  }
  
  async getUserActivity(period: string): Promise<any> {
    try {
      // Calculate date range based on period
      const today = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'day':
          startDate.setDate(today.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(today.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(today.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(today.getFullYear() - 1);
          break;
        default:
          startDate.setDate(today.getDate() - 7); // Default to week
      }
      
      // Get users created in period
      const usersInPeriod = await db.select().from(users)
        .where(gte(users.createdAt, startDate));
      
      // Get game players in period (as proxy for active users)
      const activeGamePlayers = await db.select()
        .from(gamePlayers)
        .innerJoin(games, eq(gamePlayers.gameId, games.id))
        .where(gte(games.createdAt, startDate));
      
      // Get unique active user IDs
      const activeUserIds = new Set(activeGamePlayers.map(gp => gp.userId));
      
      // Group registrations by day for chart data
      const usersByDay: Record<string, number> = {};
      
      // Initialize all days in the period
      for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        usersByDay[dateStr] = 0;
      }
      
      // Count users per day
      usersInPeriod.forEach(user => {
        const dateStr = new Date(user.createdAt).toISOString().split('T')[0];
        usersByDay[dateStr] = (usersByDay[dateStr] || 0) + 1;
      });
      
      // Format for chart data
      const chartData = Object.entries(usersByDay).map(([date, count]) => ({
        date,
        newUsers: count
      }));
      
      return {
        totalNewUsers: usersInPeriod.length,
        totalActiveUsers: activeUserIds.size,
        chartData,
        period
      };
    } catch (error) {
      console.error("Error getting user activity:", error);
      return {
        totalNewUsers: 0,
        totalActiveUsers: 0,
        chartData: [],
        period
      };
    }
  }
  
  async getTransactionSummary(period: string): Promise<any> {
    try {
      // Calculate date range based on period
      const today = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'day':
          startDate.setDate(today.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(today.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(today.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(today.getFullYear() - 1);
          break;
        default:
          startDate.setDate(today.getDate() - 7); // Default to week
      }
      
      // Get transactions in period
      const transactionsInPeriod = await db.select().from(transactions)
        .where(gte(transactions.createdAt, startDate));
      
      // Count transactions by type and status
      const byType: Record<string, number> = {};
      const byStatus: Record<string, number> = {};
      const byTypeAndStatus: Record<string, Record<string, number>> = {};
      
      transactionsInPeriod.forEach(tx => {
        // By type
        byType[tx.type] = (byType[tx.type] || 0) + 1;
        
        // By status
        byStatus[tx.status] = (byStatus[tx.status] || 0) + 1;
        
        // By type and status
        if (!byTypeAndStatus[tx.type]) {
          byTypeAndStatus[tx.type] = {};
        }
        byTypeAndStatus[tx.type][tx.status] = (byTypeAndStatus[tx.type][tx.status] || 0) + 1;
      });
      
      // Calculate total volumes by type
      const volumeByType: Record<string, number> = {};
      
      transactionsInPeriod.forEach(tx => {
        volumeByType[tx.type] = (volumeByType[tx.type] || 0) + tx.amount;
      });
      
      return {
        totalTransactions: transactionsInPeriod.length,
        byType,
        byStatus,
        byTypeAndStatus,
        volumeByType,
        period
      };
    } catch (error) {
      console.error("Error getting transaction summary:", error);
      return {
        totalTransactions: 0,
        byType: {},
        byStatus: {},
        byTypeAndStatus: {},
        volumeByType: {},
        period
      };
    }
  }
}

// Create a session store for express-session
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import session from "express-session";

const PostgresSessionStore = connectPg(session);

// Create a session store instance
export const sessionStore = new PostgresSessionStore({
  pool,
  tableName: 'session', // Default session table name
  createTableIfMissing: true
});

// Use the database implementation
export const storage = new DatabaseStorage();
