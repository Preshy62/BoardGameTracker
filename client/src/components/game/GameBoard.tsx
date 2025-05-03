import { useState, useEffect } from "react";
import GameStone from "./GameStone";
import { cn, formatCurrency } from "@/lib/utils";
import { Timer, Award } from "lucide-react";
import { GameStatus, Game, User, GamePlayer } from "@shared/schema";

interface GameBoardProps {
  game: Game;
  currentPlayerId: number;
  players: (GamePlayer & { user: User })[];
  onRollStone: () => void;
  rollingStoneNumber: number | null;
  userId: number;
  timeRemaining?: number;
  isCurrentPlayerTurn: boolean;
}

const GameBoard = ({
  game,
  currentPlayerId,
  players,
  onRollStone,
  rollingStoneNumber,
  userId,
  timeRemaining,
  isCurrentPlayerTurn
}: GameBoardProps) => {
  // Define the game stones
  const gameStones = [
    // Top row
    29, 40, 32, 81, 7,
    // Second row
    13, 64, 1000, 101, 4,
    // Middle row
    65, 12, 500, 20, 44,
    // Fourth row
    28, 105, 99, 82, 3,
    // Bottom row
    11, 37, 27, 5, 40
  ];

  // Calculate total pool
  const totalPool = game.stake * players.length;
  const commissionAmount = totalPool * game.commissionPercentage;
  const winnerAmount = totalPool - commissionAmount;

  return (
    <div className="flex-grow p-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-4xl mx-auto">
        {/* Game Status Bar */}
        <div className="bg-primary p-4 text-white flex justify-between items-center">
          <div>
            <h2 className="font-sans font-bold text-lg">Game #{game.id}</h2>
            <p className="text-sm opacity-75">
              Stake: <span className="text-secondary font-semibold">{formatCurrency(game.stake)}</span> • {players.length} Players
            </p>
          </div>
          <div className="flex items-center">
            {timeRemaining !== undefined && (
              <div className="bg-primary-light px-3 py-1 rounded-full text-sm mr-2 flex items-center">
                <Timer className="w-4 h-4 mr-1" />
                <span>{timeRemaining}</span>
              </div>
            )}
            <div className={cn(
              "px-3 py-1 rounded-full text-white text-sm font-medium",
              game.status === "waiting" ? "bg-secondary" : 
              game.status === "in_progress" ? "bg-accent" : 
              "bg-success"
            )}>
              <span>{
                game.status === "waiting" ? "Waiting" : 
                game.status === "in_progress" ? "In Progress" :
                "Completed"
              }</span>
            </div>
          </div>
        </div>
        
        {/* Game Board */}
        <div className="relative p-4 md:p-8 bg-primary">
          <div className="bg-primary-light border-4 border-gray-700 rounded-lg p-4 md:p-6 mx-auto" style={{ maxWidth: "600px" }}>
            {/* Game Title */}
            <h3 className="text-center text-white text-2xl font-sans font-bold mb-6">BIG BOYS GAME</h3>
            
            {/* Game Stones Grid */}
            <div className="grid grid-cols-5 gap-3 md:gap-4 mb-6">
              {gameStones.map((stoneNumber, index) => (
                <GameStone
                  key={index}
                  number={stoneNumber}
                  isRolling={rollingStoneNumber === stoneNumber}
                  isSpecial={stoneNumber === 500 || stoneNumber === 1000}
                />
              ))}
            </div>
            
            {/* Total Pool */}
            <div className="bg-primary-light p-3 rounded-lg text-center mb-6">
              <h4 className="text-white text-sm uppercase tracking-wider mb-1">MONEY IN THE BANK</h4>
              <p className="text-secondary font-mono font-bold text-3xl">{formatCurrency(winnerAmount)}</p>
            </div>
            
            {/* Game Action Button */}
            <div className="text-center">
              <button
                onClick={onRollStone}
                disabled={!isCurrentPlayerTurn || game.status !== "in_progress"}
                className={cn(
                  "text-primary text-lg font-sans font-bold py-3 px-8 rounded-lg shadow-lg transform transition",
                  isCurrentPlayerTurn && game.status === "in_progress"
                    ? "bg-secondary hover:bg-secondary-dark hover:scale-105"
                    : "bg-gray-400 cursor-not-allowed"
                )}
              >
                {isCurrentPlayerTurn ? "ROLL STONE" : "WAITING FOR YOUR TURN"}
              </button>
              <div className="mt-2 text-xs text-white">
                {game.status === "in_progress" 
                  ? (isCurrentPlayerTurn 
                     ? "It's your turn! Click to roll!" 
                     : "Waiting for another player to roll...") 
                  : "Game is not in progress"}               
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
