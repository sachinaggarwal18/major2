import { 
  AuthResponse, 
  LoginRequest, 
  PatientSignupRequest, 
  DoctorSignupRequest, 
  PrescriptionCreateRequest 
} from '../types/api';
import { Prescription, Patient, Doctor } from '../types/models';

const API_URL = 'http://localhost:8000';

// Helper function for API calls
async function apiCall<T, R>(
  endpoint: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', 
  data?: T,
  token?: string
): Promise<R> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw errorData;
  }

  return response.json();
}

// Auth service functions
export const authService = {
  patientSignup: (data: PatientSignupRequest): Promise<AuthResponse> => 
    apiCall<PatientSignupRequest, AuthResponse>('/patients/signup', 'POST', data),

  patientLogin: (data: LoginRequest): Promise<AuthResponse> => 
    apiCall<LoginRequest, AuthResponse>('/patients/login', 'POST', data),

  doctorSignup: (data: DoctorSignupRequest): Promise<AuthResponse> => 
    apiCall<DoctorSignupRequest, AuthResponse>('/doctors/signup', 'POST', data),

  doctorLogin: (data: LoginRequest): Promise<AuthResponse> => 
    apiCall<LoginRequest, AuthResponse>('/doctors/login', 'POST', data),
};

// Patient service functions
export const patientService = {
  getProfile: (token: string): Promise<{ patient: Patient }> => 
    apiCall<undefined, { patient: Patient }>('/patients/profile', 'GET', undefined, token),
};

// Doctor service functions
export const doctorService = {
  getProfile: (token: string): Promise<{ doctor: Doctor }> => 
    apiCall<undefined, { doctor: Doctor }>('/doctors/profile', 'GET', undefined, token),
};

// Prescription service functions
export const prescriptionService = {
  createPrescription: (data: PrescriptionCreateRequest, token: string): Promise<{ message: string, prescriptionId: string }> => 
    apiCall<PrescriptionCreateRequest, { message: string, prescriptionId: string }>('/prescriptions/create', 'POST', data, token),

  getAllPrescriptions: (token: string): Promise<Prescription[]> => 
    apiCall<undefined, Prescription[]>('/prescriptions', 'GET', undefined, token),

  getPrescriptionById: (id: string, token: string): Promise<Prescription> => 
    apiCall<undefined, Prescription>(`/prescriptions/${id}`, 'GET', undefined, token),
};