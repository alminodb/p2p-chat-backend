const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getNotifications, sendNotification, deleteNotification } = require('../controllers/notificationController');

const router = express.Router();

router.route("/").get(protect, getNotifications).post(protect, sendNotification);
router.route("/delete").put(protect, deleteNotification);

module.exports = router;