export interface Patient {
  id: string;  // Changed from _id to id to match API response
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
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface Prescription {
  _id: string;
  patientId: string | Patient;
  doctorId: string | Doctor;
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
