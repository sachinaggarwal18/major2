const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const patientModel = require("../models/patient.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ==================== Patient Signup ====================
router.post(
  "/signup",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Invalid email format"),
    body("password")
      .isLength({ min: 5 })
      .withMessage("Password must be at least 5 characters long"),
    body("age").isInt({ min: 1 }).withMessage("Age must be a positive number"),
    body("phoneNumber")
      .isLength({ min: 10, max: 15 })
      .withMessage("Phone number must be valid"),
    body("gender").notEmpty().withMessage("Gender is required"),
    body("address").trim().notEmpty().withMessage("Address is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { name, email, password, age, phoneNumber, gender, address } =
      req.body;

    try {
      // Check if patient already exists
      const existing = await patientModel.findOne({
        $or: [{ email }, { phoneNumber }],
      });
      if (existing)
        return res.status(400).json({ message: "Patient already registered" });

      // Hash the password before saving
      const hashedPassword = await bcrypt.hash(password, 10);

      // Save the patient with hashed password
      const newPatient = await patientModel.create({
        name,
        email,
        password: hashedPassword, // ✅ Store hashed password
        age,
        phoneNumber,
        gender,
        address,
      });

      // Generate JWT token
      const token = jwt.sign(
        { id: newPatient._id, email: newPatient.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res
        .status(201)
        .json({ message: "Patient registered successfully", token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ==================== Patient Login ====================
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
      // Fetch patient and ensure password is selected if schema has select: false
      const patient = await patientModel.findOne({ email }).select("+password");

      if (!patient)
        return res.status(400).json({ message: "Invalid email or password" });

      console.log("Input Password:", password);
      console.log("Patient Password from DB (Hashed):", patient.password);

      // Compare the plain password with the stored hashed password
      const isMatch = await bcrypt.compare(password, patient.password);

      if (!isMatch)
        return res.status(400).json({ message: "Invalid email or password" });

      // Generate JWT token on successful login
      const token = jwt.sign(
        { id: patient._id, email: patient.email },
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
