import { Server } from "socket.io";
import express from "express";
import http from "http";

const app = express();

app.get("/", (req, res) => {
  res.send("Hello World");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://projectsworkboard.vercel.app",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  allowEIO3: true,
  addTrailingSlash: false,
});

let users = [];

const addUsers = (userId, socketId) => {
  !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId });
};

const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return users.find((user) => user.userId === userId);
};

io.on("connection", (socket) => {
  console.log("user connected" + socket.id);

  socket.on("addUser", (userId) => {
    addUsers(userId, socket.id);
    io.emit("getUsers", users);
  });

  socket.on("sendMessage", ({ senderId, receiverId, text }) => {
    const user = getUser(receiverId);
    if (user) {
      io.to(user.socketId).emit("getMessage", { senderId, text });
    } else {
      console.log("Receiver not found:", receiverId);
    }
  });

  socket.on("disconnect", () => {
    console.log("user Disconnected");
    removeUser(socket.id);
    io.emit("getUsers", users);
  });

  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err.message);
  });
});

server.listen(3000, () => {
  console.log("server is running in Port 3000");
});
