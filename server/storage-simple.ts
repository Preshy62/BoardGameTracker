import { 
  users, User, InsertUser,
  games, Game, InsertGame,
  gamePlayers, GamePlayer, InsertGamePlayer,
  messages, Message, InsertMessage,
  transactions, Transaction, InsertTransaction,
  GameStatus
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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
  getGameStatistics(period: string): Promise<any>;
  getFinancialStatistics(period: string): Promise<any>;
  getUserActivity(period: string): Promise<any>;
  getTransactionSummary(period: string): Promise<any>;

  sessionStore: session.Store;
}

// Simple in-memory storage implementation
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
  
  public sessionStore: session.Store;

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

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const usersArray = Array.from(this.users.values());
    return usersArray.find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const usersArray = Array.from(this.users.values());
    return usersArray.find(user => user.email === email);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser & { avatarInitials: string }): Promise<User> {
    const user: User = { 
      id: this.currentUserId++,
      username: insertUser.username,
      password: insertUser.password,
      email: insertUser.email,
      walletBalance: 0,
      avatarInitials: insertUser.avatarInitials,
      isAdmin: insertUser.isAdmin || false,
      isActive: insertUser.isActive !== undefined ? insertUser.isActive : true,
      createdAt: new Date(),
      emailVerified: insertUser.emailVerified !== undefined ? insertUser.emailVerified : false,
      verificationToken: insertUser.verificationToken || null,
      verificationTokenExpires: insertUser.verificationTokenExpires || null,
      resetPasswordToken: null,
      resetPasswordTokenExpires: null,
      emailNotifications: insertUser.emailNotifications || {"transactions": true, "marketing": true, "gameUpdates": true},
      countryCode: insertUser.countryCode || 'NG',
      preferredCurrency: insertUser.preferredCurrency || 'NGN',
      language: insertUser.language || 'en',
      timeZone: insertUser.timeZone || null,
      bankDetails: insertUser.bankDetails || null,
      isVerified: insertUser.isVerified !== undefined ? insertUser.isVerified : false,
      verificationLevel: insertUser.verificationLevel || 0,
      stripeCustomerId: null,
      stripeSubscriptionId: null
    };
    
    this.users.set(user.id, user);
    return user;
  }

  async updateUserBalance(userId: number, newBalance: number): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');
    
    user.walletBalance = newBalance;
    this.users.set(userId, user);
    return user;
  }

  async updateUserProfile(userId: number, updates: Partial<User>): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');
    
    Object.assign(user, updates);
    this.users.set(userId, user);
    return user;
  }

  async updateUserBankDetails(userId: number, bankDetails: any): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');
    
    user.bankDetails = bankDetails;
    this.users.set(userId, user);
    return user;
  }

  async deleteUser(userId: number): Promise<boolean> {
    return this.users.delete(userId);
  }

  // Game operations
  async getGame(id: number): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async getGames(): Promise<Game[]> {
    return Array.from(this.games.values());
  }

  async getGamesByStatus(status: GameStatus): Promise<Game[]> {
    return Array.from(this.games.values()).filter(game => game.status === status);
  }

  async getAvailableGames(currency?: string, minStake?: number, maxStake?: number): Promise<Game[]> {
    let games = Array.from(this.games.values()).filter(game => game.status === 'waiting');
    
    if (currency) {
      games = games.filter(game => game.currency === currency);
    }
    
    if (minStake !== undefined) {
      games = games.filter(game => game.stakeAmount >= minStake);
    }
    
    if (maxStake !== undefined) {
      games = games.filter(game => game.stakeAmount <= maxStake);
    }
    
    return games;
  }

  async getUserGames(userId: number): Promise<Game[]> {
    const userGameIds = Array.from(this.gamePlayers.values())
      .filter(gp => gp.userId === userId)
      .map(gp => gp.gameId);
    
    return Array.from(this.games.values())
      .filter(game => userGameIds.includes(game.id));
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const game: Game = {
      id: this.currentGameId++,
      creatorId: insertGame.creatorId,
      maxPlayers: insertGame.maxPlayers,
      stake: insertGame.stake,
      status: 'waiting',
      commissionPercentage: insertGame.commissionPercentage || 0.05,
      createdAt: new Date(),
      endedAt: null,
      winnerIds: insertGame.winnerIds || null,
      winningNumber: insertGame.winningNumber || null,
      currency: insertGame.currency || 'NGN',
      gameType: insertGame.gameType || 'standard',
      description: insertGame.description || null,
      rules: insertGame.rules || null,
      minPlayers: insertGame.minPlayers || 2,
      maxDuration: insertGame.maxDuration || null,
      isPrivate: insertGame.isPrivate || false,
      joinCode: insertGame.joinCode || null,
      gameSettings: insertGame.gameSettings || null,
      prize: insertGame.prize || null,
      tags: insertGame.tags || null,
      difficulty: insertGame.difficulty || 'medium',
      region: insertGame.region || null,
      language: insertGame.language || 'en'
    };
    
    this.games.set(game.id, game);
    return game;
  }

  async updateGame(gameId: number, updates: Partial<InsertGame>): Promise<Game> {
    const game = this.games.get(gameId);
    if (!game) throw new Error('Game not found');
    
    Object.assign(game, updates);
    this.games.set(gameId, game);
    return game;
  }

  async updateGameStatus(gameId: number, status: GameStatus): Promise<Game> {
    const game = this.games.get(gameId);
    if (!game) throw new Error('Game not found');
    
    game.status = status;
    if (status === 'active') {
      game.startedAt = new Date();
    } else if (status === 'completed') {
      game.endedAt = new Date();
    }
    
    this.games.set(gameId, game);
    return game;
  }

  async updateGameWinners(gameId: number, winnerIds: number[], winningNumber: number): Promise<Game> {
    const game = this.games.get(gameId);
    if (!game) throw new Error('Game not found');
    
    game.winnerIds = winnerIds;
    game.winningNumber = winningNumber;
    game.status = 'completed';
    game.endedAt = new Date();
    
    this.games.set(gameId, game);
    return game;
  }

  async endGame(gameId: number): Promise<Game> {
    return this.updateGameStatus(gameId, 'completed');
  }

  // GamePlayer operations
  async getGamePlayer(gameId: number, userId: number): Promise<GamePlayer | undefined> {
    for (const gp of this.gamePlayers.values()) {
      if (gp.gameId === gameId && gp.userId === userId) {
        return gp;
      }
    }
    return undefined;
  }

  async getGamePlayers(gameId: number): Promise<(GamePlayer & { user: User })[]> {
    const players = Array.from(this.gamePlayers.values())
      .filter(gp => gp.gameId === gameId);
    
    return players.map(player => {
      const user = this.users.get(player.userId);
      if (!user) throw new Error(`User ${player.userId} not found`);
      return { ...player, user };
    });
  }

  async createGamePlayer(insertGamePlayer: InsertGamePlayer): Promise<GamePlayer> {
    const gamePlayer: GamePlayer = {
      id: this.currentGamePlayerId++,
      gameId: insertGamePlayer.gameId,
      userId: insertGamePlayer.userId,
      turnOrder: insertGamePlayer.turnOrder,
      rolledNumber: null,
      hasRolled: false,
      joinedAt: new Date(),
      leftAt: null,
      isActive: true,
      position: insertGamePlayer.position || null,
      score: 0,
      lastActionAt: new Date(),
      connectionStatus: 'connected',
      isReady: false,
      powerUps: null,
      achievements: null,
      gameLogs: null,
      winShare: null,
      voiceChatEnabled: null,
      timeoutCount: null
    };
    
    this.gamePlayers.set(gamePlayer.id, gamePlayer);
    return gamePlayer;
  }

  async updateGamePlayerRoll(gamePlayerId: number, rolledNumber: number): Promise<GamePlayer> {
    const gamePlayer = this.gamePlayers.get(gamePlayerId);
    if (!gamePlayer) throw new Error('GamePlayer not found');
    
    gamePlayer.rolledNumber = rolledNumber;
    gamePlayer.hasRolled = true;
    gamePlayer.lastActionAt = new Date();
    
    this.gamePlayers.set(gamePlayerId, gamePlayer);
    return gamePlayer;
  }

  async updateGamePlayerStatus(gamePlayerId: number, updates: Partial<GamePlayer>): Promise<GamePlayer> {
    const gamePlayer = this.gamePlayers.get(gamePlayerId);
    if (!gamePlayer) throw new Error('GamePlayer not found');
    
    Object.assign(gamePlayer, updates);
    this.gamePlayers.set(gamePlayerId, gamePlayer);
    return gamePlayer;
  }

  async markPlayerAsWinner(gameId: number, userId: number, winShare: number): Promise<GamePlayer> {
    const gamePlayer = await this.getGamePlayer(gameId, userId);
    if (!gamePlayer) throw new Error('GamePlayer not found');
    
    gamePlayer.winShare = winShare;
    this.gamePlayers.set(gamePlayer.id, gamePlayer);
    return gamePlayer;
  }

  async getGameWinners(gameId: number): Promise<(GamePlayer & { user: User })[]> {
    const winners = Array.from(this.gamePlayers.values())
      .filter(gp => gp.gameId === gameId && gp.winShare && gp.winShare > 0);
    
    return winners.map(winner => {
      const user = this.users.get(winner.userId);
      if (!user) throw new Error(`User ${winner.userId} not found`);
      return { ...winner, user };
    });
  }

  // Message operations
  async getGameMessages(gameId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => msg.gameId === gameId)
      .sort((a, b) => (a.createdAt || new Date()).getTime() - (b.createdAt || new Date()).getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const message: Message = {
      id: this.currentMessageId++,
      gameId: insertMessage.gameId,
      userId: insertMessage.userId,
      content: insertMessage.content,
      type: insertMessage.type || 'chat',
      createdAt: new Date()
    };
    
    this.messages.set(message.id, message);
    return message;
  }

  // Transaction operations
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const transaction: Transaction = {
      id: this.currentTransactionId++,
      userId: insertTransaction.userId,
      type: insertTransaction.type,
      amount: insertTransaction.amount,
      currency: insertTransaction.currency,
      status: insertTransaction.status || 'pending',
      reference: insertTransaction.reference || `txn_${Date.now()}`,
      description: insertTransaction.description || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null,
      failureReason: null,
      metadata: null,
      conversionRate: null,
      fees: null,
      bankDetails: null,
      withdrawalMethod: null
    };
    
    this.transactions.set(transaction.id, transaction);
    return transaction;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(tx => tx.userId === userId)
      .sort((a, b) => (b.createdAt || new Date()).getTime() - (a.createdAt || new Date()).getTime());
  }

  async getTransaction(transactionId: number): Promise<Transaction | undefined> {
    return this.transactions.get(transactionId);
  }

  async updateTransactionStatus(transactionId: number, status: string, description?: string): Promise<Transaction> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) throw new Error('Transaction not found');
    
    transaction.status = status;
    transaction.updatedAt = new Date();
    if (status === 'completed') {
      transaction.completedAt = new Date();
    }
    if (description) {
      transaction.description = description;
    }
    
    this.transactions.set(transactionId, transaction);
    return transaction;
  }

  async createWithdrawalRequest(userId: number, amount: number, currency: string, bankDetails: any): Promise<Transaction> {
    return this.createTransaction({
      userId,
      type: 'withdrawal',
      amount,
      currency,
      status: 'pending',
      reference: `withdrawal_${Date.now()}`,
      description: 'Withdrawal request',
      bankDetails
    });
  }

  async convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<{amount: number, rate: number}> {
    // Mock conversion rates - in production this would use a real API
    const rates: Record<string, number> = {
      'USD': 1.0,
      'EUR': 0.85,
      'GBP': 0.75,
      'NGN': 411.0,
      'GHS': 6.0,
      'KES': 110.0
    };
    
    const fromRate = rates[fromCurrency] || 1;
    const toRate = rates[toCurrency] || 1;
    const rate = toRate / fromRate;
    const convertedAmount = amount * rate;
    
    return {
      amount: convertedAmount,
      rate
    };
  }

  // Admin operations
  async getAllTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values());
  }

  async getGameStatistics(period: string): Promise<any> {
    const games = Array.from(this.games.values());
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }
    
    const gamesInPeriod = games.filter(g => 
      g.createdAt && g.createdAt >= startDate
    );
    
    return {
      totalGames: gamesInPeriod.length,
      completedGames: gamesInPeriod.filter(g => g.status === 'completed').length,
      activeGames: gamesInPeriod.filter(g => g.status === 'active').length,
      waitingGames: gamesInPeriod.filter(g => g.status === 'waiting').length,
      period
    };
  }

  async getFinancialStatistics(period: string): Promise<any> {
    const transactions = Array.from(this.transactions.values());
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }
    
    const transactionsInPeriod = transactions.filter(tx => 
      tx.createdAt && tx.createdAt >= startDate && tx.status === 'completed'
    );
    
    const totalDeposits = transactionsInPeriod
      .filter(tx => tx.type === 'deposit')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const totalWithdrawals = transactionsInPeriod
      .filter(tx => tx.type === 'withdrawal')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const totalFees = transactionsInPeriod
      .filter(tx => tx.type === 'commission')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    return {
      totalDeposits,
      totalWithdrawals,
      totalFees,
      netRevenue: totalDeposits - totalWithdrawals + totalFees,
      period
    };
  }

  async getUserActivity(period: string): Promise<any> {
    const users = Array.from(this.users.values());
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }
    
    const newUsers = users.filter(u => 
      u.createdAt && u.createdAt >= startDate
    );
    
    const activeUsers = users.filter(u => 
      u.lastLoginAt && u.lastLoginAt >= startDate
    );
    
    return {
      totalUsers: users.length,
      newUsers: newUsers.length,
      activeUsers: activeUsers.length,
      period
    };
  }

  async getTransactionSummary(period: string): Promise<any> {
    const transactions = Array.from(this.transactions.values());
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }
    
    const transactionsInPeriod = transactions.filter(tx => 
      tx.createdAt && tx.createdAt >= startDate
    );
    
    const summary = {
      pending: transactionsInPeriod.filter(tx => tx.status === 'pending').length,
      completed: transactionsInPeriod.filter(tx => tx.status === 'completed').length,
      failed: transactionsInPeriod.filter(tx => tx.status === 'failed').length,
      deposits: transactionsInPeriod.filter(tx => tx.type === 'deposit').length,
      withdrawals: transactionsInPeriod.filter(tx => tx.type === 'withdrawal').length,
      period
    };
    
    return summary;
  }
}

// Export the storage instance
export const storage = new MemStorage();