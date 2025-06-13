// Temporary fix for roll stone endpoint
// This replaces the broken endpoint with a clean implementation

const rollStoneEndpoint = (app, storage, authenticate) => {
  app.post("/api/games/:id/roll", authenticate, async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const userId = req.session.userId;

      console.log(`User ${userId} attempting to roll stone in game ${gameId}`);

      // Get game
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }

      // Get players
      const players = await storage.getGamePlayers(gameId);
      const gamePlayer = players.find(p => p.userId === userId);
      
      if (!gamePlayer) {
        return res.status(403).json({ error: "You are not a player in this game" });
      }

      if (gamePlayer.rolledNumber !== null) {
        return res.status(400).json({ error: "You have already rolled" });
      }

      if (players.length < 2) {
        return res.status(400).json({ error: "Not enough players to start the game" });
      }

      // Generate random roll - Big Boys Game mechanics
      const possibleRolls = [1, 2, 3, 4, 5, 6, 500, 1000, 3355, 6624];
      const rolledNumber = possibleRolls[Math.floor(Math.random() * possibleRolls.length)];
      
      console.log(`User ${userId} rolled: ${rolledNumber} in game ${gameId}`);

      // Update player's roll
      await storage.updateGamePlayerRoll(gamePlayer.id, rolledNumber);

      // Check if all players rolled
      const updatedPlayers = await storage.getGamePlayers(gameId);
      const allRolled = updatedPlayers.every(p => p.rolledNumber !== null);

      if (allRolled) {
        // Determine winners
        const maxNumber = Math.max(...updatedPlayers.map(p => p.rolledNumber));
        const winners = updatedPlayers.filter(p => p.rolledNumber === maxNumber);

        // Calculate prizes
        const totalPot = game.stakePot;
        const commissionAmount = Math.floor(totalPot * game.commissionPercentage);
        const prizePool = totalPot - commissionAmount;
        const prizePerWinner = Math.floor(prizePool / winners.length);

        // Distribute prizes
        for (const winner of winners) {
          const user = await storage.getUser(winner.userId);
          if (user) {
            await storage.updateUserBalance(winner.userId, user.walletBalance + prizePerWinner);
            await storage.createTransaction({
              userId: winner.userId,
              type: 'game_win',
              amount: prizePerWinner,
              currency: game.currency,
              status: 'completed',
              reference: `game-${gameId}-win`
            });
          }
        }

        // End game
        await storage.updateGameWinners(gameId, winners.map(w => w.userId), maxNumber);
        await storage.updateGameStatus(gameId, 'completed');

        console.log(`Game ${gameId} completed! Winners: ${winners.map(w => w.userId).join(', ')} with roll ${maxNumber}`);
      }

      res.json({ 
        message: "Roll submitted successfully",
        rolledNumber,
        allPlayersRolled: allRolled
      });

    } catch (error) {
      console.error('Error processing roll:', error);
      res.status(500).json({ error: "Failed to process roll" });
    }
  });
};

module.exports = rollStoneEndpoint;