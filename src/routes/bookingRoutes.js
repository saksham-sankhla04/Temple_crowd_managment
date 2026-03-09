const express = require("express");
const { createBooking, getMyBookings } = require("../controllers/bookingController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createBooking);
router.get("/mine", protect, getMyBookings);

module.exports = router;

