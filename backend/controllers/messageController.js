const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");

const sendMessage = asyncHandler(async (req, res) => {
    const { content, chatId } = req.body;

    const newMessage = {
        sender: req.user._id,
        content: content,
        chat: chatId
    };

    try {

        var message = await Message.create(newMessage);

        message = await message.populate("sender", "-password");
        message = await message.populate("chat");
        message = await User.populate(message, {
            path: "chat.users",
            select: "-password"
        });

        await Chat.findByIdAndUpdate(chatId, {
            latestMessage: message
        });

        res.json(message);

    } catch (error) {
        res.status(400).json({ message: error.message });
    }

});

const getAllMessages = asyncHandler(async (req, res) => {
    const { chatId } = req.params;

    try {
        var allMessages = await Message.find({ chat: chatId })
        .populate("sender", "-password")
        .populate("chat");

        allMessages = await User.populate(allMessages, {
            path: "chat.users",
            select: "-password"
        });

        allMessages = await Message.populate(allMessages, {
            path: "chat.latestMessage"
        });
        
        res.json(allMessages);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = { sendMessage, getAllMessages }