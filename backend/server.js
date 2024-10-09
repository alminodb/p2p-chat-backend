const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const colors = require('colors');

const User = require("./models/userModel")

const userRoutes = require('./routes/userRoutes');
const chatRoutes = require("./routes/chatRoutes");

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

app.listen(PORT, console.log(`Server started on PORT ${PORT}`.magenta.bold));