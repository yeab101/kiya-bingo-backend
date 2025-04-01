require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectToDatabase = require("./utils/db");
const socketHandlers = require('./utils/socketHandlers');
const { checkAndResumeGames } = require('./utils/resumeGames');
const BingoGame = require("./models/bingoGameModel");
const { handleCheckBingo } = require('./utils/handleBingo');

const mongoUrl = process.env.MONGOURL;
const PORT = process.env.PORT;

// App Configuration
const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
}));

app.use(express.json());

// Routes
app.use("/api/user", require("./routes/userRoute"));
// app.use("/api/callback", require("./routes/callbackRoute"));
app.use("/api/game", require("./routes/gameRoutes"));
app.use("/api/transaction", require("./routes/transactionRoutes")); 
app.use("/api/admin", require("./routes/adminRoutes")); 

// Socket.io Configuration
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"] 
  }
});

// Socket Event Handlers
const handleSocketConnection = (socket) => {
  console.log('A user connected');

  socket.on('joinRoom', async ({ gameId }) => {
    try {
      socket.join(gameId);
      console.log(`User joined game room: ${gameId}`);

      const game = await BingoGame.findOne({ gameId }).select('-__v -randomNumbers');
      if (game) {
        socket.emit('gameDetails', game);
      } else {
        socket.emit('error', { message: 'Game not found' });
      }
    } catch (error) {
      console.error('Error joining game room:', error);
      socket.emit('error', { message: 'Error joining game room' });
    }
  });

  socket.on('add-cartela', (data) => {
    socketHandlers.handleAddCartela(socket, data, io);
  });

  socket.on('check-bingo', async (data) => {  
    try {
      const result = await handleCheckBingo(data); 
      if (result && result.isWinner) {
        io.to(data.gameId).emit('bingo-winner', (result));
      } else {
        socket.emit('bingo-result', { 
          isWinner: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error("Error in check-bingo handler:", error);
      socket.emit('error', { message: 'Error checking bingo pattern' });
    }
  });

  socket.on('pre-buy-cartela', (data) => {
    socketHandlers.handlePreBuyCartela(socket, data, io);
  });
  
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
};

io.on('connection', handleSocketConnection);

// Initialize Server
const startServer = async () => {
  try {
    await connectToDatabase(mongoUrl);
    
    // Start the server first to ensure socket.io is ready
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      // Move checkAndResumeGames inside the callback to ensure server is ready
      checkAndResumeGames(io);
    });
  } catch (error) {
    console.error("Error connecting to the database:", error);
    process.exit(1);
  }
};

startServer();
