const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");
const generateToken = require("../config/generateToken");
const bcrypt = require("bcryptjs");


const accessChat = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    let chat;

    if (!userId) {
        res.status(400).json({ message: "UserId not provided!" });
        return;
    }

    try {
        chat = await Chat.find({
            isGroupChat: false,
            $and: [
                { users: { $elemMatch: { $eq: req.user._id } } },
                { users: { $elemMatch: { $eq: userId } } }
            ]
        }).populate("users", "-password").populate("latestMessage");

    } catch (error) {
        res.status(400).json({ message: error.message });
    }

    if (chat.length > 0) {
        res.send(chat[0]);
    } else {
        const chatData = {
            chatName: "chatyy",
            isGroupChat: false,
            users: [userId, req.user._id]
        };

        try {
            const newChat = await Chat.create(chatData);

            const fullChat = Chat.findOne({ _id: newChat._id }).populate("users", "-password").populate("latestMessage");

            res.status(200).send(fullChat);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
});


const fetchChats = asyncHandler(async (req, res) => {

    const { _id } = req.user;

    if (!_id) {
        res.status(400).json({ message: "No user id provided!" });
    }

    try {
        let chats = await Chat.find(
            { users: { $elemMatch: { $eq: _id } } }
        )
            .populate("users", "-password")
            .populate("groupAdmin", "-password")
            .populate("latestMessage")
            .sort({ updatedAt: -1 })

        chats = await User.populate(chats, {
            path: "latestMessage.sender",
            select: "name picture email"
        })

        res.send(chats);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

const createGroupChat = asyncHandler(async (req, res) => {

    if (!req.body.users || !req.body.chatName) {
        res.status(400).json({ message: "No users or group chat name provided!" });
    }

    let users = JSON.parse(JSON.stringify(req.body.users));

    if (users.length < 2) {
        res.status(400).json({ message: "Two or more users are required to make a group chat." });
        return;
    }

    users.push(req.user._id);

    try {
        const newChat = await Chat.create({
            chatName: req.body.chatName,
            isGroupChat: true,
            users: users,
            groupAdmin: req.user._id
        });

        const fullChat = await Chat.findOne({ _id: newChat._id })
            .populate("users", "-password")
            .populate("groupAdmin", "-password")

        res.send(fullChat);

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

const renameGroup = asyncHandler(async (req, res) => {
    const { chatId, chatName } = req.body;

    if (!chatId || !chatName) {
        res.status(400).json({ message: "No chat id or new chat name provided!" });
        return;
    }

    try {
        const updated = await Chat.findByIdAndUpdate(
            chatId,
            {
                chatName: chatName
            },
            {
                new: true
            }
        ).populate("users", "-password").populate("groupAdmin", "-password");

        res.send(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

const addToGroup = asyncHandler(async (req, res) => {
    const { chatId, userId } = req.body;

    if (!chatId || !userId) {
        res.status(400).json({ message: "No chat id or user id provided!" });
        return;
    }

    try {
        const added = await Chat.findByIdAndUpdate(
            chatId,
            {
                $push: { users: userId }
            },
            {
                new: true
            }
        ).populate("users", "-password").populate("groupAdmin", "-password");

        if (!added) {
            res.status(400).json({ message: error.message });
            return;
        }
        else {
            res.send(added);
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

const removeFromGroup = asyncHandler(async (req, res) => {
    const { chatId, userId } = req.body;

    if (!chatId || !userId) {
        res.status(400).json({ message: "No chat id or user id provided!" });
        return;
    }

    try {
        const removed = await Chat.findByIdAndUpdate(
            chatId,
            {
                $pull: { users: userId }
            },
            {
                new: true
            }
        ).populate("users", "-password").populate("groupAdmin", "-password");

        if (!removed) {
            res.status(400).json({ message: error.message });
            return;
        }
        else {
            res.send(removed);
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});








// const accessChat = asyncHandler(async (req, res) => {
//     const { userId } = req.body;

//     if (!userId) {
//         res.status(400).json({ message: "UserId not send within request!" });
//         return;
//     }

//     var chat = await Chat.find({
//         isGroupChat: false,
//         $and: [
//             { users: { $elemMatch: { $eq: req.user._id } } },
//             { users: { $elemMatch: { $eq: userId } } },
//         ]
//     }).populate("users", "-password").populate("latestMessage");

//     chat = await User.populate(chat, {
//         path: "latestMessage.sender",
//         select: "name picture email"
//     });

//     if (chat.length > 0) {
//         res.send(chat[0]);
//     } else {
//         var chatData = {
//             chatName: "sender",
//             isGroupChat: false,
//             users: [req.user._id, userId]
//         };

//         try {
//             const createdChat = await Chat.create(chatData);

//             const fullChat = await Chat.findOne({ _id: createdChat._id }).populate("users", "-password");

//             res.status(200).send(fullChat);
//         } catch (error) {
//             res.status(400).json({ message: error.message });
//         }
//     }
// });

module.exports = { accessChat, fetchChats, createGroupChat, renameGroup, addToGroup, removeFromGroup }