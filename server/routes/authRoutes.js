const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Teacher = require("../models/Teacher");

const router = express.Router();

router.post("/register", async (req, res) => {
    try {

        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingTeacher = await Teacher.findOne({
            email: normalizedEmail
        });

        if (existingTeacher) {
            return res.status(409).json({
                message: "Email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const teacher = await Teacher.create({
            fullName: fullName.trim(),
            email: normalizedEmail,
            password: hashedPassword
        });

        res.status(201).json({
            success: true,
            message: "Teacher registered successfully"
        });

    } catch (error) {

        if (error.code === 11000) {
            return res.status(409).json({
                message: "Email already exists"
            });
        }

        res.status(500).json({
            message: error.message
        });

    }
});

router.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const teacher = await Teacher.findOne({
            email: email.trim().toLowerCase()
        });

        if (!teacher) {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        const validPassword = await bcrypt.compare(
            password,
            teacher.password
        );

        if (!validPassword) {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        const token = jwt.sign(
            {
                id: teacher._id,
                email: teacher.email,
                fullName: teacher.fullName
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        res.json({
            success: true,
            message: "Login successful",
            teacher: {
                id: teacher._id,
                fullName: teacher.fullName,
                email: teacher.email
            },
            token
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

});

module.exports = router;