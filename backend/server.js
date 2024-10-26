const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const colors = require('colors');

const User = require("./models/userModel")

const userRoutes = require('./routes/userRoutes');
const chatRoutes = require("./routes/chatRoutes");
const messageRoute = require('./routes/messageRoutes');
const notificationRoute = require("./routes/notificationRoutes");

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
app.use("/api/notification", notificationRoute);

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

        if (!activeUsers.some((user) => user.userId === userData._id)) {
            activeUsers.push({ userId: userData._id, socketId: socket.id });
        }

        io.emit("get active users", activeUsers);
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

        console.log(newMessageReceived.content)
    });

    socket.on("disconnect", () => {
        console.log("User disconnected.");

        activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
        io.emit("get active users", activeUsers);

    });

    socket.on("log out", (userData) => {
        console.log("USER LOGGED OUT");
        socket.leave(userData._id);

        activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
        io.emit("get active users", activeUsers);

    });

    socket.on("send notification", (notification) => {
        console.log("lets see this shit");
        socket.to(notification.receiver._id).emit("get notification", notification);
    })
});