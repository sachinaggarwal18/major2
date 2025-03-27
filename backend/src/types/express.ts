import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: 'patient' | 'doctor';
  };
}

export interface PatientSignupRequest {
  name: string;
  email: string;
  password: string;
  age: number;
  phoneNumber: string;
  gender: string;
  address: string;
  medicalHistory?: string;
}

export interface DoctorSignupRequest {
  name: string;
  specialization: string;
  email: string;
  password: string;
  phoneNumber: string;
  licenseNumber: string;
  hospitalAffiliation?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface PrescriptionCreateRequest {
  patientId: string;
  doctorId: string;
  date: Date;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  diagnosis: string;
  notes?: string;
}