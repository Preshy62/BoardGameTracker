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
}

// Create storage instance based on environment
export async function createStorage(): Promise<IStorage> {
  if (process.env.DATABASE_URL) {
    try {
      console.log("Attempting to use database storage...");
      const { DatabaseStorage } = await import("./storage-db");
      return new DatabaseStorage();
    } catch (error) {
      console.warn("Database storage failed, falling back to memory storage:", error);
    }
  }
  
  console.log("Using in-memory storage");
  const { MemStorage } = await import("./storage-mem");
  return new MemStorage();
}