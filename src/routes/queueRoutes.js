const express = require("express");
const {
  joinQueue,
  getQueueStatus,
  getQueueStatusByToken,
  updateQueueStatus,
  getLiveStats,
  callNextToken,
  markCalledAsCompleted,
} = require("../controllers/queueController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/join", protect, joinQueue);
router.get("/live-stats", protect, getLiveStats);
router.get("/status/by-token", protect, getQueueStatusByToken);
router.get("/:id/status", protect, getQueueStatus);
router.patch("/:id/status", protect, authorizeRoles("admin", "staff"), updateQueueStatus);
router.post("/call-next", protect, authorizeRoles("admin", "staff"), callNextToken);
router.post("/mark-completed", protect, authorizeRoles("admin", "staff"), markCalledAsCompleted);

module.exports = router;
