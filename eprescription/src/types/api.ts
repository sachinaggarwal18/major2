export interface LoginRequest {
  email: string;
  password: string;
}

export interface PatientSignupRequest {
  name: string;
  email: string;
  password: string;
  age: number;
  phoneNumber: string;
  gender: 'Male' | 'Female' | 'Other';
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

export interface AuthResponse {
  message: string;
  token: string;
}

export interface PrescriptionCreateRequest {
  patientId: string;
  diagnosis: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  notes?: string;
  date?: string;
}

export interface ApiError {
  message: string;
  errors?: Array<{
    msg: string;
    param: string;
  }>;
}