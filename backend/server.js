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

io.on("connection", (socket) => {
    console.log("Connected to socket.io");
    socket.on("setup", (userData) => {
        socket.join(userData._id);
        socket.emit("connected");
    });

    // socket.on("join chat", (room) => {
    //     socket.join(room);
    //     console.log("User Joined Room: " + room);
    // });

    // socket.on("typing", (room) => socket.in(room).emit("typing"));
    // socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

    socket.on("new message", (newMessageRecieved) => {
        var chat = newMessageRecieved.chat;

        if (!chat.users) return console.log("chat.users not defined");

        chat.users.forEach((user) => {
            if (user._id == newMessageRecieved.sender._id) return;

            socket.in(user._id).emit("message recieved", newMessageRecieved);
        });

        // ovdje bi se moglo i na drugi nacin uradit
    });

    socket.off("setup", () => {
        console.log("USER DISCONNECTED");
        socket.leave(userData._id);
    });
});


































// io.on("connection", (socket) => {
//     console.log("Connected to socket.io")

//     socket.on("setup", (userData) => {
//         socket.join(userData._id);
//         console.log(userData._id);
//         socket.emit("connected");
//     });

//     socket.on("join chat", (room) => {
//         socket.join(room);
//         console.log(`User joined room ${room}`);
//     });

//     socket.on("new message", (newMessageReceived) => {

//         var chat = newMessageReceived.chat;

//         if(!chat.users) return console.log("chat.users not defined!");

//         chat.users.forEach(user => {
//             if(user._id == newMessageReceived.sender._id) return;

//             socket.in(chat._id).emit("message received", newMessageReceived);
//         });
//     });
// })