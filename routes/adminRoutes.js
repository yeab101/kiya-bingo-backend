const express = require('express');
const router = express.Router();
const BingoGame = require('../models/bingoGameModel');

// Get all games with pagination
router.get('/games', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const games = await BingoGame.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalDocs = await BingoGame.countDocuments();
    const totalPages = Math.ceil(totalDocs / limit);

    res.json({
      games,
      totalPages,
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get game statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await BingoGame.aggregate([
      {
        $group: {
          _id: null,
          totalPlayers: { $sum: { $size: "$selectedCartela" } },
          totalStakes: { $sum: "$stake" },
          totalProfit: { $sum: { $subtract: ["$stake", "$winAmount"] } },
          avgProfitPerGame: { $avg: { $subtract: ["$stake", "$winAmount"] } }
        }
      }
    ]);
    
    res.json(stats[0] || {});
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get profit analysis
router.get('/profit', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [dailyProfit, monthlyProfit, totalProfit] = await Promise.all([
      BingoGame.aggregate([
        { $match: { createdAt: { $gte: startOfDay } } },
        { $group: { _id: null, total: { $sum: "$profitAmount" } } }
      ]),
      BingoGame.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$profitAmount" } } }
      ]),
      BingoGame.aggregate([
        { $group: { _id: null, total: { $sum: "$profitAmount" } } }
      ])
    ]);

    res.json({
      totalProfit: totalProfit[0]?.total || 0,
      todayProfit: dailyProfit[0]?.total || 0,
      monthlyProfit: monthlyProfit[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
