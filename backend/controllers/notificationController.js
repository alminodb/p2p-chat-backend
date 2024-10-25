const asyncHandler = require("express-async-handler");
const Notification = require("../models/notificationModel");

const getNotifications = asyncHandler(async (req, res) => {
    const { user } = req;

    try {
        const notifications = await Notification.find({
            receiver: { $eq: user._id }
        }).populate("receiver", "-password");

        res.status(200).send(notifications);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

const sendNotification = asyncHandler(async (req, res) => {
    const { notificationType, receiver, chatId } = req.body;
    const sender = req.user;

    if (!receiver || !notificationType) return res.status(400).json({ message: "You need to provide receiver and notificationType!" });

    const title = (notificationType === "message") ? `${sender.name} sent you a message.` : "New friend request from ${sender.name}";
    if (notificationType === "message" && !chatId) return res.status(400).json({ message: "You need to provide chatId!" });

    try {
        const notificationData = {
            title: title,
            sender: sender._id,
            receiver: receiver,
            chat: chatId,
            notificationType: notificationType
        };

        const newNotification = await Notification.create(notificationData);
        const fullNotification = await Notification.findById(newNotification._id).populate("sender", "-password").populate("receiver", "-password");

        res.status(200).send(fullNotification);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

const deleteNotification = asyncHandler(async (req, res) => {
    const { notificationId } = req.body;

    if (!notificationId) return res.status(400).json({ message: "No notificationId provided." });

    try {
        const deleted = await Notification.findByIdAndDelete(notificationId);

        res.status(200).send(deleted);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = { getNotifications, sendNotification, deleteNotification }