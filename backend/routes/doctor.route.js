const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const doctorModel = require("../models/doctor.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Doctor Signup
router.post(
  "/signup",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Invalid email format"),
    body("password")
      .isLength({ min: 5 })
      .withMessage("Password must be at least 5 characters long"),
    body("specialization").notEmpty().withMessage("Specialization is required"),
    body("phoneNumber")
      .isLength({ min: 10, max: 15 })
      .withMessage("Phone number must be valid"),
    body("experienceYears")
      .isInt({ min: 0 })
      .withMessage("Experience must be a positive number"),
    body("clinicAddress")
      .trim()
      .notEmpty()
      .withMessage("Clinic address is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const {
      name,
      email,
      password,
      specialization,
      phoneNumber,
      experienceYears,
      clinicAddress,
    } = req.body;

    try {
      const existing = await doctorModel.findOne({
        $or: [{ email }, { phoneNumber }],
      });
      if (existing)
        return res.status(400).json({ message: "Doctor already registered" });

      const hashPassword = await bcrypt.hash(password, 10);
      const newDoctor = await doctorModel.create({
        name,
        email,
        password: hashPassword,
        specialization,
        phoneNumber,
        experienceYears,
        clinicAddress,
      });

      const token = jwt.sign(
        { id: newDoctor._id, email: newDoctor.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res
        .status(201)
        .json({ message: "Doctor registered successfully", token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Doctor Login
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Enter valid email"),
    body("password")
      .isLength({ min: 5 })
      .withMessage("Password must be at least 5 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    try {
      const doctor = await doctorModel.findOne({ email });
      if (!doctor)
        return res.status(400).json({ message: "Invalid email or password" });

      const isMatch = await bcrypt.compare(password, doctor.password);
      if (!isMatch)
        return res.status(400).json({ message: "Invalid email or password" });

      const token = jwt.sign(
        { id: doctor._id, email: doctor.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      res.status(200).json({ message: "Login successful", token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
