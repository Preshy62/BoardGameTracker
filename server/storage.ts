import { 
  users, User, InsertUser,
  games, Game, InsertGame,
  gamePlayers, GamePlayer, InsertGamePlayer,
  messages, Message, InsertMessage,
  transactions, Transaction, InsertTransaction,
  GameStatus
} from "@shared/schema";

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
  updateTransactionStatus(transactionId: number, status: string): Promise<Transaction>;
  
  // Currency operations
  convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<{amount: number, rate: number}>;
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
  
  async updateTransactionStatus(transactionId: number, status: string): Promise<Transaction> {
    const transaction = await this.getTransaction(transactionId);
    if (!transaction) {
      throw new Error(`Transaction with ID ${transactionId} not found`);
    }
    
    const updatedTransaction = { ...transaction, status };
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

export const storage = new MemStorage();
