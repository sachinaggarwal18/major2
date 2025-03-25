const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String, required: true },
});

const prescriptionSchema = new mongoose.Schema({
  patientEmail: { type: String, required: true },
  diagnosis: { type: String, required: true },
  medicines: [medicineSchema],
  advice: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Prescription", prescriptionSchema);
