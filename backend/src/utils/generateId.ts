import { nanoid } from 'nanoid';
import prisma from './prisma';

// Length of the random part of the ID (e.g., ABC123XY)
const ID_LENGTH = 8;

/**
 * Generate a unique short ID for a user with a specific prefix
 * @param prefix - The prefix to use (e.g., 'PAT' for patients, 'DOC' for doctors)
 * @param existingIds - Optional array of existing IDs to check against
 * @returns A unique short ID
 */
export async function generateUniqueId(prefix: 'PAT' | 'DOC'): Promise<string> {
  while (true) {
    // Generate random ID of specified length
    const randomPart = nanoid(ID_LENGTH).toUpperCase();
    const shortId = `${prefix}-${randomPart}`;

    // Check if this ID already exists in either Patient or Doctor table
    const existingPatient = await prisma.patient.findUnique({
      where: { shortId },
      select: { id: true }
    });

    const existingDoctor = await prisma.doctor.findUnique({
      where: { shortId },
      select: { id: true }
    });

    // If ID doesn't exist in either table, return it
    if (!existingPatient && !existingDoctor) {
      return shortId;
    }
    // If ID exists, loop will continue and generate a new one
  }
}

/**
 * Generate a unique short ID for a patient
 */
export function generatePatientId(): Promise<string> {
  return generateUniqueId('PAT');
}

/**
 * Generate a unique short ID for a doctor
 */
export function generateDoctorId(): Promise<string> {
  return generateUniqueId('DOC');
}
