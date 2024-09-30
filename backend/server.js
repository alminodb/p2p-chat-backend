const express = require('express');
const dotenv = require('dotenv');

const app = express();
const chats = require('./data/data');

dotenv.config();
const PORT = process.env.PORT || 5000;

app.get("/api/chats", (req, res) => {
    res.send(chats);
})

app.get("/api/chats/:id", (req, res) => {
    const singleChat = chats.find((c) => c._id === req.params.id);
    res.send(singleChat);
})

app.listen(PORT, console.log(`Server started on PORT ${PORT}`));