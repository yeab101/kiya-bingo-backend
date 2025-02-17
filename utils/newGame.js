const BingoGame = require("../models/bingoGameModel"); 

async function createNewBingoGame(stake) {
  try {
    const bingoGame = new BingoGame({
      stake: stake
    });
    const newBingoGame = await bingoGame.save();
    console.log("New Bingo game created:", newBingoGame);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
} 

async function handleGameEnd(gameId, io) {
  console.log('\n=== Game State ===');
  console.log('Action: Game ending');
  console.log('Active Countdowns:', Array.from(global.gameCountdowns?.keys() || []));
  console.log('Active Number Callings:', Array.from(global.numberIntervals?.keys() || []));
  console.log('================\n');

  console.log("handle Game end triggered for gameId: ", gameId);
  try {
    // Get the current game and its pre-bought cartelas
    const currentGame = await BingoGame.findOne({ gameId });
    if (!currentGame) {
      console.log('No game found to end');
      return;
    }

    const { stake, preBoughtCartelas = [] } = currentGame;

    // Create new game
    const newGame = new BingoGame({
      stake,
      selectedCartela: preBoughtCartelas.map(pc => pc.cartela),
      playerCartelas: preBoughtCartelas,
      winAmount: calculateWinAmount(preBoughtCartelas.length, stake)
    });

    await newGame.save();

    const finalGame = await BingoGame.findOneAndUpdate(
      { gameId },
      { gameStatus: "finished" },
      { new: true }
    );

    // Clear intervals for the old game
    if (global.gameCountdowns?.has(gameId)) {
      clearInterval(global.gameCountdowns.get(gameId).interval);
      global.gameCountdowns.delete(gameId);
    }
    if (global.numberIntervals?.has(gameId)) {
      clearInterval(global.numberIntervals.get(gameId));
      global.numberIntervals.delete(gameId);
    }

    // // Start countdown for new game if there are pre-bought cartelas
    // if (preBoughtCartelas.length > 0) {  
    //   checkAndResumeGames(io);
    // }

    // Notify clients about game end and new game
    // io.to(gameId).emit('gameEnded', {
    //   message: 'Game has ended',
    //   newGameId: newGame.gameId
    // });
    

    io.to(gameId).emit('gameEnd', { message: 'Game has ended!' });
    io.to(gameId).emit('bingo-winner', { message: 'Game has ended!' });
    console.log("handle Game end .... finished");

    return newGame;
  } catch (error) {
    console.error('Error in handleGameEnd:', error);
    io.to(gameId).emit('error', { message: 'Error ending game' });
  }
}

// Helper function to calculate win amount
function calculateWinAmount(numCartelas, stake) {
  const posWin = numCartelas * stake;
  return posWin - (posWin * 0.2);
}

module.exports = { createNewBingoGame, handleGameEnd }; 