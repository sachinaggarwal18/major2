export interface Patient {
  id: string;
  shortId: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  email: string;
  phoneNumber: string;
  address: string;
  medicalHistory?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: string;
  shortId: string;
  name: string;
  specialization: string;
  email: string;
  phoneNumber: string;
  licenseNumber: string;
  hospitalAffiliation?: string;
  experience?: number;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Medication {
  id: string; // Add the ID field
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  patient: Patient;
  doctor: Doctor;
  date: string;
  diagnosis: string;
  medications: Medication[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  userType: 'patient' | 'doctor' | null;
  userId: string | null;
}
