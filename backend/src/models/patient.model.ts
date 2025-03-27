import mongoose, { Schema } from 'mongoose';
import { IPatient } from '../types/models';

const patientSchema = new Schema<IPatient>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
      min: [0, 'Age must be a positive number'],
    },
    gender: {
      type: String,
      required: true,
      enum: ['Male', 'Female', 'Other'],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // prevents password from being fetched unless selected explicitly
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      minlength: [10, 'Phone number must be at least 10 digits'],
      maxlength: [15, 'Phone number must be at most 15 digits'],
      match: [/^\d+$/, 'Phone number must contain only numbers'],
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    medicalHistory: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

const Patient = mongoose.model<IPatient>('Patient', patientSchema);
export default Patient;