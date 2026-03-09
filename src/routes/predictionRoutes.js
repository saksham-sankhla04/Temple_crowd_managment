const express = require("express");
const { getPrediction } = require("../controllers/predictionController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/:templeId", protect, getPrediction);
router.get("/:templeId/hourly", protect, getPrediction);

module.exports = router;
