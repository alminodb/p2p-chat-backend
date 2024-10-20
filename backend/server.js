const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const colors = require('colors');

const User = require("./models/userModel")

const userRoutes = require('./routes/userRoutes');
const chatRoutes = require("./routes/chatRoutes");
const messageRoute = require('./routes/messageRoutes');

dotenv.config();
const PORT = process.env.PORT || 5000;

connectDB();
const app = express();
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Chat API");
});

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoute);

const server = app.listen(PORT, console.log(`Server started on PORT ${PORT}`.magenta.bold));

const io = require("socket.io")(server, {
    pingTime: 60000,
    cors: {
        origin: "http://localhost:3000"
    },

});

let activeUsers = [];

io.on("connection", (socket) => {
    console.log("User connected.");

    socket.on("setup", (userData) => {
        socket.join(userData._id);
        socket.emit("connected");
        console.log(`User joined: ${userData.name}`);

        if (!activeUsers.includes(userData._id)) {
            activeUsers.push(userData._id);
            activeUsers.forEach(us => {
                socket.to(us).emit("get active users", activeUsers);
            });
        }
    });

    socket.on("find active users", (uData) => {
        socket.nsp.to(uData._id).emit("get active users", activeUsers);
    })

    socket.on("new message", (newMessageReceived) => {
        var chat = newMessageReceived.chat;


        if (!chat.users) return console.log("chat.users not defined");

        chat.users.forEach((user) => {
            if (user._id == newMessageReceived.sender._id) return;

            socket.in(user._id).emit("message received", newMessageReceived);
        });
    });

    socket.on("disconnect", () => {
        console.log("User disconnected.");

        const rooms = Array.from(socket.rooms);
        activeUsers.forEach((active, index) => {
            if(!rooms.includes(active)) {
                activeUsers.splice(index+1);
            }
        });
        activeUsers && activeUsers.forEach((active) => {
            socket.to(active).emit("get active users", activeUsers);
        });
    });

    socket.on("log out", (userData) => {
        console.log("USER LOGGED OUT");
        socket.leave(userData._id);

        const rooms = Array.from(socket.rooms);
        activeUsers.forEach((active, index) => {
            if(!rooms.includes(active)) {
                activeUsers.splice(index+1);
            }
        });
        activeUsers && activeUsers.forEach((active) => {
            socket.to(active).emit("get active users", activeUsers);
        });
    });
});