const express = require('express');
const { registerUser, loginUser, allUsers, acceptFriend, addFriend, removeFriend, getAllFriends, declineFriend, fetchMyInfo, getAllNotifications } = require('../controllers/userController');
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").post(registerUser).get(protect, allUsers);
router.route("/me").get(protect, fetchMyInfo);
router.post("/login", loginUser);

router.route("/friend/add").post(protect, addFriend);
router.route("/friend/accept").post(protect, acceptFriend);
router.route("/friend/decline").post(protect, declineFriend);

router.route("/friend/remove").post(protect, removeFriend);
router.route("/friend/:userId").get(protect, getAllFriends);

module.exports = router;