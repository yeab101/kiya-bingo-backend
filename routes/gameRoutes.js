const express = require('express');
const BingoGame = require('../models/bingoGameModel'); 
const router = express.Router();
const { createNewBingoGame } = require('../utils/newGame');

// Route to get the last game for a specific stake
router.get('/:stake', async (req, res) => {
    try {
        const { stake } = req.params;
        const lastGame = await BingoGame.findOne({ stake }).sort({ createdAt: -1 });

        if (!lastGame) {
            await createNewBingoGame(stake);
            return res.status(404).json({ message: 'No game found for this stake' });
        }
        res.status(200).json(lastGame);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route to get a specific game by ID
router.get('/game/:gameId', async (req, res) => {
    try {
        const { gameId } = req.params;
        const game = await BingoGame.findOne({ gameId });
        
        if (!game) {
            return res.status(404).json({ message: 'Game not found' });
        }
        
        res.status(200).json(game);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Route to get all games in waiting status
router.get('/status/finished', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 50;
        const skip = (page - 1) * limit;

        const finishedGames = await BingoGame.find({ gameStatus: "finished" })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalGames = await BingoGame.countDocuments({ gameStatus: "finished" });
        
        res.status(200).json({
            games: finishedGames,
            currentPage: page,
            totalPages: Math.ceil(totalGames / limit),
            totalGames
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// // Route to create a new game
// router.post('/create/:stake', async (req, res) => {
//     try {
//         const { stake } = req.params;

//         const newGame = new BingoGame({ 
//             stake,
//         });

//         const savedGame = await newGame.save();
//         res.status(201).json(savedGame);
//     } catch (error) {
//         res.status(400).json({ message: error.message });
//     }
// });

module.exports = router; 