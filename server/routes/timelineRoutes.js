const express = require("express");
const router = express.Router();
const Timeline = require("../models/Timeline");
const { dedupeTimelineEvents } = require("../utils/sessionReport");

// Get session timeline
router.get("/session/:code", async (req, res) => {
  try {
    const sessionCode = req.params.code.toUpperCase();
    const events = await Timeline.find({ sessionCode }).sort({ timestamp: 1 });
    res.status(200).json(dedupeTimelineEvents(events.map((event) => event.toObject())));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
