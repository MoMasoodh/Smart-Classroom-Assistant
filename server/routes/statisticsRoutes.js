const express = require("express");
const router = express.Router();
const { getSessionStatistics } = require("../controllers/statisticsController");
const { requireTeacherAuth } = require("../middleware/authMiddleware");

router.get("/:sessionCode", requireTeacherAuth, getSessionStatistics);

module.exports = router;
