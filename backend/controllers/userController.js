const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const generateToken = require("../config/generateToken");
const bcrypt = require("bcryptjs");

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, pic } = req.body;

    if (!name || !email || !password) {
        res.status(400).json({ message: "Fill all fields!" });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400).json({ message: "User already exists!" });
    }

    const user = await User.create({
        name, email, password, pic
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            pic: user.picture,
            token: generateToken(user._id)
        });
    } else {
        res.status(400).json({ message: "Failed creating a new user!" });
    }

})

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({ message: "You need to fill email and password!" });
    }

    const user = await User.findOne({ email }).populate("friends", "-password").populate("pendingFriends", "-password");

    if (user && (await bcrypt.compare(password, user.password))) {
        res.status(201);
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            pic: user.picture,
            friends: user.friends,
            pendingFriends: user.pendingFriends,
            token: generateToken(user._id)
        });
    }
    else {
        res.status(401).json({ message: "Invalid email or password!" });
    }
})

const allUsers = asyncHandler(async (req, res) => {
    const search = req.query.search ? {
        $or: [
            { name: { $regex: req.query.search, $options: "i" } },
            { email: { $regex: req.query.search, $options: "i" } }
        ]
    } : {}

    let users = await User.find(search).find({ _id: { $ne: req.user._id } });

    res.send(users);
});

//////////////////////////////////////// friends system

const addFriend = asyncHandler(async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        res.status(400).json({ message: "User ID not provided!" });
        return;
    }

    if (req.user.friends.includes(userId)) {
        return res.status(400).json({ message: "You already are friends with that user." });
    }

    if (req.user.pendingFriends.includes(userId)) {
        return res.status(400).json({ message: "You already added this user as a friend." });
    }

    const data = await User.findOne({
        _id: userId,
        pendingFriends: {
            $elemMatch: { $eq: req.user._id }
        }
    });

    if (data) {
        return res.status(400).json({ message: "You already sent this user a friend request." });
    }

    try {
        const added = await User.findByIdAndUpdate(
            userId,
            {
                $push: { pendingFriends: req.user._id }
            }
        );

        res.status(200).send(added);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

const acceptFriend = asyncHandler(async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        res.status(400).json({ message: "User ID not provided!" });
        return;
    }

    if (req.user.friends.includes(userId)) {
        return res.status(400).json({ message: "This user is already your friend." });
    }

    if (!req.user.pendingFriends.includes(userId)) {
        return res.status(400).json({ message: "This user didn't sent you a friend request." });
    }

    try {

        await User.findByIdAndUpdate(
            userId,
            {
                $push: { friends: req.user._id }
            },
            {
                new: true
            }
        );

        const adder = await User.findByIdAndUpdate(
            req.user._id,
            {
                $push: { friends: userId },
                $pull: { pendingFriends: userId }
            },
            {
                new: true
            }
        ).populate("friends", "-password").populate("pendingFriends", "-password");

        res.status(200).send(adder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

const declineFriend = asyncHandler(async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        res.status(400).json({ message: "User ID not provided!" });
        return;
    }

    if (req.user.friends.includes(userId)) {
        return res.status(400).json({ message: "This user is already your friend." });
    }

    if (!req.user.pendingFriends.includes(userId)) {
        return res.status(400).json({ message: "This user didn't sent you a friend request." });
    }

    try {

        const adder = await User.findByIdAndUpdate(
            req.user._id,
            {
                $pull: { pendingFriends: userId }
            },
            {
                new: true
            }
        ).populate("friends", "-password").populate("pendingFriends", "-password");

        res.status(200).send(adder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

const removeFriend = asyncHandler(async (req, res) => {

    const { userId } = req.body;

    if (!userId) {
        res.status(400).json({ message: "User ID not provided!" });
        return;
    }

    if (!req.user.friends.includes(userId)) {
        return res.status(400).json({ message: "This user is not in your friend list." });
    }

    try {
        const data = await User.findByIdAndUpdate(
            req.user._id,
            {
                $pull: { friends: userId }
            },
            {
                new: true
            }
        ).populate("friends", "-password").populate("pendingFriends", "-password");

        await User.findByIdAndUpdate(
            userId,
            {
                $pull: { friends: req.user._id }
            },
            {
                new: true
            }
        );

        res.status(200).send(data);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }

});

const getAllFriends = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        res.status(400).json({ message: "User ID not provided!" });
        return;
    }

    try {
        const data = await User.findById(userId).populate("friends", "-password")

        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = { registerUser, loginUser, allUsers, addFriend, acceptFriend, declineFriend, removeFriend, getAllFriends }