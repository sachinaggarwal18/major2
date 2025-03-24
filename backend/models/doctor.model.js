const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    specialization: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      minlength: [10, "Phone number must be at least 10 digits"],
      maxlength: [15, "Phone number must be at most 15 digits"],
      match: [/^\d+$/, "Phone number must contain only numbers"],
    },
    password: { type: String, required: true },
    experienceYears: {
      type: Number,
      min: [0, "Experience must be a positive number"],
      required: true,
    },
    clinicAddress: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const Doctor = mongoose.model("Doctor", doctorSchema);
module.exports = Doctor;
