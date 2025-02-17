const BingoGame = require('../models/bingoGameModel');
const User = require('../models/userModel');
const { createNewBingoGame } = require('../utils/newGame');

const bingoPatterns = [
    ["B1", "B2", "B3", "B4", "B5"],
    ["I1", "I2", "I3", "I4", "I5"],
    ["N1", "N2", "N4", "N5"],
    ["G1", "G2", "G3", "G4", "G5"],
    ["O1", "O2", "O3", "O4", "O5"],
    ["B1", "I1", "N1", "G1", "O1"],
    ["B2", "I2", "N2", "G2", "O2"],
    ["B3", "I3", "G3", "O3"],
    ["B4", "I4", "N4", "G4", "O4"],
    ["B5", "I5", "N5", "G5", "O5"],
    ["B1", "I2", "G4", "O5"],
    ["B5", "I4", "G2", "O1"],
    ["B1", "B5", "O1", "O5"]
];

const handleCheckBingo = async (data) => {
    const { markedNumbers, clickedBoardKeys, gameId, chatId, cartela } = data;
    const game = await BingoGame.findOne({ gameId });
    
    // Check if game exists
    if (!game) {
        return {
            isWinner: false,
            message: 'Game not found'
        };
    }

    // Check if game is already finished
    if (game.gameStatus === 'finished') {
        return {
            isWinner: false,
            message: 'This game has already ended'
        };
    }

    const user = await User.findOne({ chatId });
    if (!user) {
        return {
            isWinner: false,
            message: 'User not found'
        };
    }

    const calledNumbers = game.calledNumbers;
    const winAmount = game.winAmount;

    // First verify all marked numbers were actually called
    const validMarks = markedNumbers.every(number =>
        number === '*' || calledNumbers.includes(number)
    ); 

    if (!validMarks) { 
        return {
            isWinner: false,
            message: 'Invalid marks: Some numbers have not been called yet'
        };
    }

    // Check each pattern
    for (let index = 0; index < bingoPatterns.length; index++) {
        const pattern = bingoPatterns[index];
        const isMatch = pattern.every(key => clickedBoardKeys.includes(key));
        if (isMatch) {
            console.log(`Match found in pattern ${index + 1}:`, pattern);
            
            // Update user balance
            user.balance += winAmount;
            await user.save();

            // End current game and create new one
            game.gameStatus = "finished";
            await game.save();

            // Clear any existing intervals for this game
            if (global.numberIntervals?.has(gameId)) {
                clearInterval(global.numberIntervals.get(gameId));
                global.numberIntervals.delete(gameId);
            }

            // Create new game with same stake
            await createNewBingoGame(game.stake);

            return {
                isWinner: true,
                winningPattern: pattern,
                cartela: cartela,
                chatId: chatId,
                username: user.username,
                clickedBoardKeys: clickedBoardKeys,
                winAmount: winAmount
            };
        }
    }

    // If no winning pattern is found
    return {
        isWinner: false,
        message: 'No winning pattern found on this card'
    };
};

module.exports = {
    handleCheckBingo
};

