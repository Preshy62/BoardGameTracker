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

  // Game operations
  getGame(id: number): Promise<Game | undefined>;
  getGames(): Promise<Game[]>;
  getGamesByStatus(status: GameStatus): Promise<Game[]>;
  getUserGames(userId: number): Promise<Game[]>;
  createGame(game: InsertGame): Promise<Game>;
  updateGameStatus(gameId: number, status: GameStatus): Promise<Game>;
  updateGameWinner(gameId: number, winnerId: number, winningNumber: number): Promise<Game>;
  endGame(gameId: number): Promise<Game>;

  // GamePlayer operations
  getGamePlayer(gameId: number, userId: number): Promise<GamePlayer | undefined>;
  getGamePlayers(gameId: number): Promise<(GamePlayer & { user: User })[]>;
  createGamePlayer(gamePlayer: InsertGamePlayer): Promise<GamePlayer>;
  updateGamePlayerRoll(gamePlayerId: number, rolledNumber: number): Promise<GamePlayer>;

  // Message operations
  getGameMessages(gameId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
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
      createdAt: now 
    };
    this.users.set(id, user);
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
    const game: Game = {
      ...insertGame,
      id,
      status: "waiting",
      createdAt: now,
      endedAt: null,
      winnerId: null,
      winningNumber: null
    };
    this.games.set(id, game);
    return game;
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

  async updateGameWinner(gameId: number, winnerId: number, winningNumber: number): Promise<Game> {
    const game = await this.getGame(gameId);
    if (!game) {
      throw new Error(`Game with ID ${gameId} not found`);
    }
    
    const updatedGame = { 
      ...game, 
      winnerId, 
      winningNumber,
      status: "completed"
    };
    this.games.set(gameId, updatedGame);
    return updatedGame;
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
      rolledNumber: null,
      hasRolled: false,
      joinedAt: now
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
    
    const updatedGamePlayer = { 
      ...gamePlayer, 
      rolledNumber, 
      hasRolled: true 
    };
    this.gamePlayers.set(gamePlayer.id, updatedGamePlayer);
    return updatedGamePlayer;
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
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      createdAt: now
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
}

export const storage = new MemStorage();
