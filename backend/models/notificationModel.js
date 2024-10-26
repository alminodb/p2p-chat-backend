const mongoose = require("mongoose");

const notificationSchema = mongoose.Schema(
    {
        title: {
            type: String,
            trim: true
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        chat: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chat"
        },
        notificationType: {
            type: String,
            default: 'message'
        }
    },
    {
        timestamps: true
    }
);

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;