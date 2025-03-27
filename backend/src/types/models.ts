import { Document } from 'mongoose';

export interface IPatient extends Document {
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  email: string;
  password: string;
  phoneNumber: string;
  address: string;
  medicalHistory?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDoctor extends Document {
  name: string;
  specialization: string;
  email: string;
  password: string;
  phoneNumber: string;
  licenseNumber: string;
  hospitalAffiliation?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPrescription extends Document {
  patientId: IPatient['_id'];
  doctorId: IDoctor['_id'];
  date: Date;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  diagnosis: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}