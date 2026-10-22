
const express = require("express");
const router = express.Router();

const {
  createBooking,
  getMyBookings,
} = require("../controllers/bookingController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, createBooking);
router.get("/my", authMiddleware, getMyBookings);

module.exports = router;
