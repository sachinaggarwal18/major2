// Remove AuthRequest interface

// Extend base Request to include request ID and user
declare global {
  namespace Express {
    interface Request {
      id?: string; // For request ID tracking
      user?: {
        id: string;
        email: string;
        type: 'patient' | 'doctor'; // Use 'type' consistent with authenticate middleware
      };
    }
  }
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
  patientShortId: string;
  date?: Date;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  diagnosis: string;
  notes?: string;
}
