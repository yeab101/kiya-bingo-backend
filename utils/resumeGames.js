const BingoGame = require('../models/bingoGameModel');
const { startCountdown, startCallingNumbers } = require('./socketHandlers');
const { handleGameEnd } = require('./newGame');

async function checkAndResumeGames(io) {
    try {
        // Find all games that are in 'waiting' or 'started' state
        const activeGames = await BingoGame.find({
            gameStatus: { $in: ['waiting', 'started'] }
        });

        for (const game of activeGames) {
            if (game.gameStatus === 'waiting' && game.selectedCartela.length >= 1) {
                // Resume countdown for games that were waiting with players
                startCountdown(game.gameId, io);
            } else if (game.gameStatus === 'started') {
                // Skip games that are marked as started but haven't called any numbers yet
                if (game.calledNumbers.length === 0) {
                    // Reset game status to 'waiting' if it has players
                    if (game.selectedCartela.length >= 1) {
                        await BingoGame.findOneAndUpdate(
                            { gameId: game.gameId },
                            { gameStatus: 'waiting' }
                        );
                        startCountdown(game.gameId, io);
                    }
                    continue;
                }

                // Resume number calling for games that were in progress
                const remainingNumbers = game.randomNumbers.filter(
                    num => !game.calledNumbers.includes(num)
                );
                if (remainingNumbers.length > 0) {
                    startCallingNumbers(game.gameId, io);
                } else {
                    // If all numbers were called, end the game
                    await handleGameEnd(game.gameId, io);
                }
            }
        }
    } catch (error) {
        console.error('Error checking and resuming games:', error);
    }
}

module.exports = { checkAndResumeGames };
