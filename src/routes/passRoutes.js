const express = require("express");
const { bookPass, verifyPass, markPassUsed, getMyPasses } = require("../controllers/passController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/book", protect, bookPass);
router.get("/mine", protect, getMyPasses);
router.get("/verify/:passCode", protect, verifyPass);
router.patch("/use/:passCode", protect, authorizeRoles("admin", "staff"), markPassUsed);

module.exports = router;
