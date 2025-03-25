const express = require("express");
const router = express.Router();
const Prescription = require("../models/prescription.model");

// Create Prescription API
router.post("/create", async (req, res) => {
  const { patientEmail, diagnosis, medicines, advice } = req.body;
  try {
    const newPrescription = new Prescription({
      patientEmail,
      diagnosis,
      medicines,
      advice,
    });
    await newPrescription.save();
    res.status(201).json({ message: "Prescription created successfully" });
  } catch (error) {
    console.error("Error creating prescription:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Get All Prescriptions (Optional)
router.get("/", async (req, res) => {
  try {
    const prescriptions = await Prescription.find();
    res.status(200).json(prescriptions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
