const express = require("express");
const {
  getTemples,
  getTempleById,
  createTemple,
  updateTemple,
  deleteTemple,
  seedTemples,
} = require("../controllers/templeController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getTemples);
router.post("/seed/init", protect, authorizeRoles("admin"), seedTemples);
router.get("/:id", getTempleById);
router.post("/", protect, authorizeRoles("admin"), createTemple);
router.put("/:id", protect, authorizeRoles("admin"), updateTemple);
router.delete("/:id", protect, authorizeRoles("admin"), deleteTemple);

module.exports = router;
