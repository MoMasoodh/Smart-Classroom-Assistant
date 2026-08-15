const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Student = require("../models/Student");

const router = express.Router();

// ===========================================
// Student Register
// ===========================================
router.post("/register", async (req, res) => {
  try {
    const {
      registerNumber,
      fullName,
      department,
      year,
      password,
    } = req.body;

    // Validate
    if (
      !registerNumber ||
      !fullName ||
      !department ||
      !year ||
      !password
    ) {
      return res.status(400).json({
        message: "Please fill all fields.",
      });
    }

    // Check existing student
    const existingStudent = await Student.findOne({
      registerNumber: registerNumber.toUpperCase(),
    });

    if (existingStudent) {
      return res.status(400).json({
        message: "Register Number already exists.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create student
    const student = await Student.create({
      registerNumber: registerNumber.toUpperCase(),
      fullName,
      department,
      year,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Student registered successfully.",
      student: {
        id: student._id,
        registerNumber: student.registerNumber,
        fullName: student.fullName,
        department: student.department,
        year: student.year,
      },
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// ===========================================
// Student Login
// ===========================================
router.post("/login", async (req, res) => {
  try {
    const { registerNumber, password } = req.body;

    const student = await Student.findOne({
      registerNumber: registerNumber.toUpperCase(),
    });

    if (!student) {
      return res.status(400).json({
        message: "Invalid Register Number or Password.",
      });
    }

    const match = await bcrypt.compare(password, student.password);

    if (!match) {
      return res.status(400).json({
        message: "Invalid Register Number or Password.",
      });
    }

    const token = jwt.sign(
      {
        id: student._id,
        registerNumber: student.registerNumber,
        fullName: student.fullName,
        role: "student",
      },
      process.env.JWT_SECRET || "dev-secret-key",
      {
        expiresIn: "7d",
      }
    );

    res.json({
      success: true,
      token,
      role: "student",
      student: {
        id: student._id,
        registerNumber: student.registerNumber,
        fullName: student.fullName,
        department: student.department,
        year: student.year,
        role: "student",
      },
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;