import { Doctor, Patient, Prescription, Medication } from '@prisma/client';

export type IDoctor = Doctor;
export type IPatient = Patient;
export type IPrescription = Prescription;
export type IMedication = Medication;

export interface IUserToken {
  id: string;
  email: string;
  role: 'doctor' | 'patient';
}
