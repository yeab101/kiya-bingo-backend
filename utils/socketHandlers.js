const BingoGame = require('../models/bingoGameModel');
const User = require('../models/userModel');
const { handleGameEnd } = require('./newGame');

function logGameState(action) {
    console.log('\n=== Game State ===');
    console.log('Action:', action);
    console.log('Active Countdowns:', Array.from(global.gameCountdowns?.keys() || []));
    console.log('Active Number Callings:', Array.from(global.numberIntervals?.keys() || []));
    console.log('================\n');
}

async function handleAddCartela(socket, data, io) {
    try {
        logGameState('New cartela request');
        const { chatId, gameId, stake, cartela } = data;
        const game = await BingoGame.findOne({ gameId, stake }).select('-randomNumbers');
        if (!game) {
            return socket.emit('error', { message: 'No game found for this stake and gameId' });
        }

        if (game.calledNumbers.length >= 75) {
            await handleGameEnd(gameId, io);
            return socket.emit('error', { message: 'Game finished' });
        }
        if (game.gameStatus === 'started' && game.calledNumbers.length > 0) {
            return socket.emit('error', { message: 'Game already started' });
        }

        // Add cartela validation
        if (game.selectedCartela.includes(cartela)) {
            return socket.emit('error', { message: 'This cartela has already been selected' });
        }

        // Clear any existing countdown for this game
        if (global.countdownIntervals?.has(gameId)) {
            clearInterval(global.countdownIntervals.get(gameId));
            global.countdownIntervals.delete(gameId);
        }

        // Update game state
        game.selectedCartela.push(cartela);
        game.playerCartelas.push({ chatId, cartela });
        console.log('game.:', game) 
        let posWin = game.selectedCartela.length * game.stake;
        game.winAmount = posWin - (posWin * 0.2);

        // Start countdown only if game hasn't started yet
        if (game.gameStatus !== 'started' && game.selectedCartela.length >= 1) {
            startCountdown(gameId, io);
            logGameState('Countdown started');
        }

        await game.save();
        
        // Update user balance
        await User.findOneAndUpdate(
            { chatId },
            { $inc: { balance: -stake } }
        );

        io.to(gameId).emit('gameDetails', game);
    } catch (error) {
        socket.emit('error', { message: error.message });
    }
}

function startCountdown(gameId, io) {
    // Store countdown state
    if (!global.gameCountdowns) {
        global.gameCountdowns = new Map();
    }

    // If countdown already exists, just emit current time to the room
    if (global.gameCountdowns.has(gameId)) {
        const existingCountdown = global.gameCountdowns.get(gameId);
        io.to(gameId).emit('countdown', { timeLeft: existingCountdown.timeLeft });
        return;
    }

    const countdownSeconds = 30;
    let timeLeft = countdownSeconds;

    const countdownState = {
        timeLeft,
        interval: setInterval(() => {
            timeLeft--;
            io.to(gameId).emit('countdown', { timeLeft });

            if (timeLeft <= 0) {
                clearInterval(countdownState.interval);
                global.gameCountdowns.delete(gameId);
                logGameState('Countdown finished');
                io.to(gameId).emit('gameStart', { message: 'Game is starting!' });
                startCallingNumbers(gameId, io);
            }
        }, 1000)
    };

    global.gameCountdowns.set(gameId, countdownState);
    logGameState('Countdown started');
}

async function startCallingNumbers(gameId, io) {
    try {
        logGameState('Starting number calling');
        // Clear any existing number calling interval
        if (global.numberIntervals?.has(gameId)) {
            clearInterval(global.numberIntervals.get(gameId));
            global.numberIntervals.delete(gameId);
        }

        const game = await BingoGame.findOne({ gameId });
        if (!game || (game.gameStatus === 'started' && game.calledNumbers.length === 0)) {
            return; // Prevent multiple starts for fresh games
        }

        // Initialize game state if it's a new game
        if (game.gameStatus !== 'started') {
            game.gameStatus = "started";
            await game.save();
        }
        
        io.to(gameId).emit('gameDetails', game);

        let currentIndex = game.calledNumbers.length; // Start from last called number
        const numbers = [...game.randomNumbers];
        let isProcessing = false;

        const numberInterval = setInterval(async () => {
            if (isProcessing) return;

            if (currentIndex >= numbers.length) {
                clearInterval(numberInterval);
                global.numberIntervals.delete(gameId);
                logGameState('Number calling finished');
                await handleGameEnd(gameId, io);
                return;
            }

            isProcessing = true;
            try {
                const nextNumber = numbers[currentIndex];
                const updatedGame = await BingoGame.findOneAndUpdate(
                    { gameId },
                    { $push: { calledNumbers: nextNumber } },
                    { new: true }
                );

                io.to(gameId).emit('numberCalled', {
                    number: nextNumber,
                    calledNumbers: updatedGame.calledNumbers,
                    gameStatus: "started"
                });

                currentIndex++;
            } finally {
                isProcessing = false;
            }
        }, 3000);

        global.numberIntervals = global.numberIntervals || new Map();
        global.numberIntervals.set(gameId, numberInterval);
        logGameState('Number calling interval set');
    } catch (error) {
        console.error('Error in startCallingNumbers:', error);
        io.to(gameId).emit('error', { message: 'Error during number calling' });
    }
} 

async function handlePreBuyCartela(socket, data, io) {
    try {
        logGameState('Pre-buy cartela request');
        const { chatId, gameId, stake, cartela } = data;
        const game = await BingoGame.findOne({ gameId, stake }).select('-randomNumbers');
        console.log(game)

        if (!game && game.gameStatus !== 'waiting') {
            return socket.emit('error', { message: 'No game found for this stake and gameId'});
        }

        // Add cartela validation
        if (game.preBoughtCartelas.some(pc => pc.cartela === cartela)) {
            return socket.emit('error', { message: 'This cartela has already been selected' });
        }

        // Update user balance
        const user = await User.findOne({ chatId });
        if (!user || user.balance < stake) {
            return socket.emit('error', { message: 'Insufficient balance' });
        }

        // Update game state
        game.preBoughtCartelas.push({ chatId, cartela });
        await game.save();
        
        // Update user balance
        await User.findOneAndUpdate(
            { chatId },
            { $inc: { balance: -stake } }
        );

        // socket.emit('preBuySuccess', { message: 'Cartela pre-bought successfully' });
        io.to(gameId).emit('gameDetails', game);
    } catch (error) {
        socket.emit('error', { message: error.message });
    }
}

module.exports = { 
    handleAddCartela,
    startCountdown,
    startCallingNumbers,
    handlePreBuyCartela
}; 