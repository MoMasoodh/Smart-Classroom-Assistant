const express = require("express");
const router = express.Router();
const Doubt = require("../models/Doubt");

// Get Answered Doubts
router.get("/session/:sessionCode/answered", async (req, res) => {
  try {
    const doubts = await Doubt.find({
      sessionCode: req.params.sessionCode,
      status: "Answered",
    });

    res.json(doubts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Pending Doubts
router.get("/session/:sessionCode/pending", async (req, res) => {
  try {
    const doubts = await Doubt.find({
      sessionCode: req.params.sessionCode,
      status: "Pending",
    });

    res.json(doubts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get All Session Doubts
router.get("/session/:sessionCode", async (req, res) => {
  try {
    const doubts = await Doubt.find({
      sessionCode: req.params.sessionCode,
    });

    res.json(doubts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create Doubt
router.post("/", async (req, res) => {
  try {
    const doubt = new Doubt(req.body);

    const savedDoubt = await doubt.save();

    res.status(201).json(savedDoubt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Answer Doubt
router.put("/:id", async (req, res) => {
  try {
    const doubt = await Doubt.findByIdAndUpdate(
      req.params.id,
      {
        answer: req.body.answer,
        status: "Answered",
      },
      { returnDocument: "after" }
    );

    res.json(doubt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete Doubt
router.delete("/:id", async (req, res) => {
  try {
    await Doubt.findByIdAndDelete(req.params.id);

    res.json({
      message: "Doubt deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;