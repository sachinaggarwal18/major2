import mongoose, { Schema } from 'mongoose';
import { IDoctor } from '../types/models';

const doctorSchema = new Schema<IDoctor>(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    specialization: { 
      type: String, 
      required: true, 
      trim: true 
    },
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
    password: { 
      type: String, 
      required: true 
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    hospitalAffiliation: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

const Doctor = mongoose.model<IDoctor>('Doctor', doctorSchema);
export default Doctor;