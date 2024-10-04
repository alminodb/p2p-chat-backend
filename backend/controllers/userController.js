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

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
        res.status(201);
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            pic: user.picture,
            token: generateToken(user._id)
        });
    }
    else {
        res.status(401).json({ message: "Invalid email or password!" });
    }
})

module.exports = { registerUser, loginUser }