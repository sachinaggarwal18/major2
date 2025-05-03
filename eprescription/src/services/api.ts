import { 
  AuthResponse, 
  LoginRequest, 
  PatientSignupRequest, 
  DoctorSignupRequest, 
  PrescriptionCreateRequest 
} from '../types/api';
import { Prescription, Patient, Doctor } from '../types/models';

// Define UploadedPrescription type based on schema
interface UploadedPrescription {
  id: string;
  patientId: string;
  filename: string;
  storagePath: string; // Note: Might not be directly useful/exposed to frontend
  fileType: string;
  uploadDate: string; // Dates are often strings in JSON
  notes: string | null;
}

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

// Helper function for FormData API calls (for file uploads)
async function apiCallFormData<R>(
  endpoint: string, 
  method: 'POST' | 'PUT', // Typically POST or PUT for uploads
  formData: FormData,
  token?: string
): Promise<R> {
  const headers: HeadersInit = {}; // Don't set Content-Type, browser does it for FormData

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: formData, // Send FormData directly
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
    
  findByShortId: (shortId: string, token: string): Promise<{ patient: Patient }> =>
    apiCall<undefined, { patient: Patient }>(`/patients/find/${shortId}`, 'GET', undefined, token),

  searchPatients: (query: string, token: string): Promise<{ patients: Patient[] }> =>
    apiCall<undefined, { patients: Patient[] }>(`/patients/search/${query}`, 'GET', undefined, token),
    
  // Upload Prescription File
  uploadPrescription: (formData: FormData, token: string): Promise<{ message: string; prescription: UploadedPrescription }> => 
    apiCallFormData<{ message: string; prescription: UploadedPrescription }>('/patients/upload-prescription', 'POST', formData, token),

  // Get Uploaded Prescriptions
  getUploadedPrescriptions: (token: string): Promise<{ prescriptions: UploadedPrescription[] }> =>
    apiCall<undefined, { prescriptions: UploadedPrescription[] }>('/patients/uploaded-prescriptions', 'GET', undefined, token),

  // Delete Uploaded Prescription
  deleteUploadedPrescription: (id: string, token: string): Promise<{ message: string }> =>
    apiCall<undefined, { message: string }>(`/patients/uploaded-prescriptions/${id}`, 'DELETE', undefined, token),
};

// Doctor service functions
export const doctorService = {
  getProfile: (token: string): Promise<{ doctor: Doctor }> => 
    apiCall<undefined, { doctor: Doctor }>('/doctors/profile', 'GET', undefined, token),
};

// Prescription service functions
export const prescriptionService = {
  createPrescription: (data: PrescriptionCreateRequest, token: string): Promise<{ message: string, prescriptionId: string, patientShortId: string }> => 
    apiCall<PrescriptionCreateRequest, { message: string, prescriptionId: string, patientShortId: string }>('/prescriptions/create', 'POST', data, token),

  getAllPrescriptions: (token: string): Promise<Prescription[]> => 
    apiCall<undefined, Prescription[]>('/prescriptions', 'GET', undefined, token),

  getPrescriptionById: (id: string, token: string): Promise<Prescription> => 
    apiCall<undefined, Prescription>(`/prescriptions/${id}`, 'GET', undefined, token),
};

// Medication Master Service
export const medicationService = {
  searchMedications: (query: string, token: string): Promise<{ medications: { id: string; name: string; description: string | null }[] }> => 
    apiCall<undefined, { medications: { id: string; name: string; description: string | null }[] }>(`/medications/search?query=${encodeURIComponent(query)}`, 'GET', undefined, token),
};
