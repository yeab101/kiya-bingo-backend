const express = require('express');
const Transaction = require('../models/transactionModel'); // Adjust the path as necessary

const router = express.Router();

// Get all transactions
router.get('/transactions', async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({createdAt: -1});
        res.status(200).json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ message: 'Error fetching transactions' });
    }
});

// Get a transaction by transactionId
router.get('/transactions/:transactionId', async (req, res) => {
    try {
        const transaction = await Transaction.findOne({ transactionId: req.params.transactionId });
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        res.status(200).json(transaction);
    } catch (error) {
        console.error('Error fetching transaction:', error);
        res.status(500).json({ message: 'Error fetching transaction' });
    }
});

// Get all deposits
router.get('/deposits', async (req, res) => {
    try {
        const deposits = await Transaction.find({ 
            type: 'deposit'
        }).sort({ createdAt: -1 }); // Most recent first

        res.status(200).json({
            success: true,
            count: deposits.length,
            data: deposits
        });
    } catch (error) {
        console.error('Error fetching deposits:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching deposits' 
        });
    }
});

// Get all withdrawals
router.get('/withdrawals', async (req, res) => {
    try {
        const withdrawals = await Transaction.find({ 
            type: 'withdrawal'
        }).sort({ createdAt: -1 }); // Most recent first

        res.status(200).json({
            success: true,
            count: withdrawals.length,
            data: withdrawals
        });
    } catch (error) {
        console.error('Error fetching withdrawals:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching withdrawals' 
        });
    }
});

// Get pending withdrawals
router.get('/withdrawals/pending', async (req, res) => {
    try {
        const pendingWithdrawals = await Transaction.find({ 
            type: 'withdrawal',
            status: 'pending_withdrawal'
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: pendingWithdrawals.length,
            data: pendingWithdrawals
        });
    } catch (error) {
        console.error('Error fetching pending withdrawals:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching pending withdrawals' 
        });
    }
});

// Get transactions by chatId
router.get('/transactions/user/:chatId', async (req, res) => {
    try {
        const { chatId } = req.params;
        const transactions = await Transaction.find({ 
            chatId 
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: transactions.length,
            data: transactions
        });
    } catch (error) {
        console.error('Error fetching user transactions:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching user transactions' 
        });
    }
});

// Delete a transaction by transactionId
router.delete('/transactions/:transactionId', async (req, res) => {
    try {
        const transaction = await Transaction.findOneAndDelete({ 
            transactionId: req.params.transactionId 
        });
        
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Transaction deleted successfully',
            data: transaction
        });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting transaction'
        });
    }
});

router.get('/pending-withdrawals', async (req, res) => {
    try {
        const pendingWithdrawals = await Transaction.find({
            type: 'withdrawal',
            status: 'pending_withdrawal'
        }).sort({ createdAt: -1 }); // Most recent first

        res.status(200).json({
            success: true,
            data: pendingWithdrawals
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch pending withdrawals'
        });
    }
});

module.exports = router; 