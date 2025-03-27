import mongoose, { Schema } from 'mongoose';
import { IPrescription } from '../types/models';

const medicationSchema = new Schema({
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  duration: { type: String, required: true }
});

const prescriptionSchema = new Schema<IPrescription>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true
    },
    date: {
      type: Date,
      default: Date.now,
      required: true
    },
    medications: [medicationSchema],
    diagnosis: {
      type: String,
      required: true
    },
    notes: {
      type: String
    }
  },
  { timestamps: true }
);

const Prescription = mongoose.model<IPrescription>('Prescription', prescriptionSchema);
export default Prescription;