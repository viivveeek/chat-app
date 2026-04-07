const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");

const app = express();
app.set("trust proxy", 1);

dotenv.config();
console.log(
  "Mongo URI Check:",
  process.env.MONGO_URI ? "Loaded" : "NOT LOADED",
);

const server = http.createServer(app);

// 1. Socket.io Configuration with Middleware Auth
const io = socketIo(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Socket.io Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token; // Client should send: { auth: { token: '...' } }

  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded.id; // Attach user ID to the socket object
    next();
  } catch (err) {
    next(new Error("Authentication error: Invalid token"));
  }
});

// 2. Security & Standard Middleware
app.use(helmet());
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// app.use(cors({ origin: "https://chat-app-zix6.vercel.app" }));

app.use(
  cors({
    origin: true, // allows ALL origins dynamically
    credentials: true,
  }),
);

app.use(express.json());

// 3. MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// 4. Routes
const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");

app.use("/api/auth", authRoutes);
// FIX: Removed authRoutes from here. chatRoutes already uses auth middleware internally.
app.use("/api/chat", chatRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Chat Backend API" });
});

// 5. Socket.io Logic
const Message = require("./models/Message");

io.on("connection", (socket) => {
  console.log("Authenticated user connected:", socket.user);

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.user} joined room ${roomId}`);
  });

  socket.on("sendMessage", async (data) => {
    console.log("Message received:", data);
    try {
      // socket.user is now guaranteed to exist because of the middleware
      const message = new Message({
        content: data.content,
        sender: socket.user,
        room: data.roomId,
        recipient: data.recipient,
      });

      await message.save();

      const populatedMessage = await message.populate("sender", "username");

      io.to(data.roomId).emit("message", populatedMessage);
    } catch (err) {
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  socket.on("typing", (data) => {
    socket.to(data.roomId).emit("typing", {
      userId: socket.user,
      roomId: data.roomId,
      isTyping: data.isTyping,
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// 6. Server Start
const PORT = process.env.PORT || 5000; // Aligned with your .env
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = server;
