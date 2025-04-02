const express = require("express");
const router = express.Router();
const User = require("../models/userModel");

// Route to get all users
router.get("/userslist", async (req, res) => {
  try {
    const users = await User.find({}).sort({ balance: -1 });
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
});

// Route to get user information by chatId
router.get("/userinfo/:chatId", async (req, res) => {
  const { chatId } = req.params;
  try {
    const user = await User.findOne({ chatId: chatId });
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error fetching user by chatId:", error);
    res.status(500).json({ message: "Error fetching user" });
  }
});

// Route to clear user balance by phone number
router.post('/clear-balance', async (req, res) => {
  try {
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
          return res.status(400).json({ 
              success: false, 
              message: 'Phone number is required' 
          });
      }

      const user = await User.findOne({ phoneNumber });

      if (!user) {
          return res.status(404).json({ 
              success: false, 
              message: 'User not found' 
          });
      }

      user.balance = 0;
      await user.save();

      res.status(200).json({
          success: true,
          message: 'Balance cleared successfully',
          data: {
              phoneNumber: user.phoneNumber,
              balance: user.balance
          }
      });

  } catch (error) {
      console.error('Error clearing balance:', error);
      res.status(500).json({ 
          success: false, 
          message: 'Internal server error' 
      });
  }
});


// Route to delete a user by chatId
router.delete("/:chatId", async (req, res) => {
  const { chatId } = req.params;
  try {
    const user = await User.findOneAndDelete({ chatId: chatId });
    if (user) {
      res.status(200).json({ message: "User deleted successfully." });
    } else {
      res.status(404).json({ message: "User not found." });
    }
  } catch (error) {
    console.error("Error deleting user by chatId:", error);
    res.status(500).json({ message: "Error deleting user." });
  }
});

module.exports = router;
