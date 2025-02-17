// const express = require('express');
// const router = express.Router();
// require("dotenv").config();
// const request = require('request');
// const User = require('../models/userModel');
// const bot = require('../utils/telegramBot');

// router.post('/verify-transaction', async (req, res) => {
//     const { tx_ref, event, first_name, mobile, amount, status } = req.body;

//     if (!tx_ref && status !== "success") {
//         return res.status(400).json({ error: "Transaction failed" });
//     }

//     console.log(`Received transaction verification request for tx_ref: ${tx_ref}`);
//     console.log(`Event: ${event}, Name: ${first_name} Mobile: ${mobile}`);
//     console.log(`Amount: ${amount}, Status: ${status}`);

//     const options = {
//         'method': 'GET',
//         'url': `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,
//         'headers': {
//             'Authorization': `Bearer ${process.env.CHAPASECRET}`
//         }
//     };

//     request(options, async function (error, response) {
//         if (error) {
//             console.error("Error verifying transaction:", error);
//             return res.status(500).json({ error: "Error verifying transaction." });
//         }

//         try {
//             const responseBody = JSON.parse(response.body);
//             console.log("Response from Chapa:", responseBody);
//             if (responseBody.status === "success") {
//                 try {
//                     const user = await User.findOne({ phoneNumber: mobile });
//                     if (!user) {
//                         console.log("User not found with mobile:", mobile);
//                         return res.status(404).json({ error: "User not found." });
//                     }
                    
//                     console.log("User found:", user);
//                     console.log("Current balance:", user.balance);
//                     console.log("Amount to add:", amount);

//                     // Convert amount to a number and update user's balance
//                     user.balance += Number(amount);
//                     console.log("New balance:", user.balance);

//                     await user.save();
//                     console.log("User balance updated successfully.");

//                     // Send a message to the user via Telegram bot
//                     bot.sendMessage(user.chatId, `Deposit successful. New Balance 💰 ${user.balance} ETB`);

//                     return res.status(200).json({ message: "Transaction verified and balance updated successfully.", user: user, data: responseBody.data });
//                 } catch (dbError) {
//                     console.error("Database error:", dbError);
//                     return res.status(500).json({ error: "Error processing user data." });
//                 }
//             } else {
//                 console.log("Transaction verification failed:", responseBody);
//                 return res.status(400).json({ error: "Transaction verification failed.", details: responseBody });
//             }
//         } catch (parseError) {
//             console.error("Error parsing response:", parseError);
//             return res.status(500).json({ error: "Error processing transaction verification response." });
//         }
//     });
// });

// module.exports = router;

