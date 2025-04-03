import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, isDoctor } from '../middleware/auth';
import { AuthRequest, PrescriptionCreateRequest } from '../types/express';
import prisma from '../utils/prisma';

// Define medication interface to prevent 'any' type
interface MedicationInput {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

const router = express.Router();

// ==================== Create Prescription ====================
router.post(
  '/create',
  authenticate,
  isDoctor,
  [
    body('patientShortId').notEmpty().withMessage('Patient Short ID is required'),
    body('diagnosis').notEmpty().withMessage('Diagnosis is required'),
    body('medications').isArray({ min: 1 }).withMessage('Medications must be provided'),
    body('medications.*.name').notEmpty().withMessage('Medication name is required'),
    body('medications.*.dosage').notEmpty().withMessage('Medication dosage is required'),
    body('medications.*.frequency').notEmpty().withMessage('Medication frequency is required'),
    body('medications.*.duration').notEmpty().withMessage('Medication duration is required'),
  ],
  async (req: Request<Record<string, never>, unknown, PrescriptionCreateRequest>, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { patientShortId, diagnosis, medications, notes, date } = req.body;
    const doctorId = (req as AuthRequest).user?.id;

    if (!doctorId) {
      res.status(401).json({ message: 'Doctor ID not found in token' });
      return;
    }

    try {
      // Find patient by shortId and validate doctor exists
      const [patient, doctorExists] = await Promise.all([
        prisma.patient.findUnique({ where: { shortId: patientShortId } }),
        prisma.doctor.findUnique({ where: { id: doctorId } })
      ]);

      if (!patient) {
        res.status(404).json({ message: `Patient with ID ${patientShortId} not found` });
        return;
      }

      if (!doctorExists) {
        res.status(404).json({ message: 'Doctor not found' });
        return;
      }

      const newPrescription = await prisma.prescription.create({
        data: {
          patientId: patient.id, // Use the actual UUID internally
          doctorId,
          date: date || new Date(),
          diagnosis,
          notes,
          medications: {
            create: medications.map(med => ({
              name: med.name,
              dosage: med.dosage,
              frequency: med.frequency,
              duration: med.duration
            }))
          }
        }
      });

      res.status(201).json({
        message: 'Prescription created successfully',
        prescriptionId: newPrescription.id,
        patientShortId: patientShortId // Return the shortId for reference
      });
    } catch (error) {
      console.error('Error creating prescription:', error);
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

// ==================== Get All Prescriptions ====================
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId || !userRole) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    
    let prescriptions;
    
    if (userRole === 'doctor') {
      prescriptions = await prisma.prescription.findMany({
        where: { doctorId: userId },
        include: {
          patient: {
            select: {
              id: true,
              shortId: true,
              name: true,
              age: true,
              gender: true,
              email: true,
              phoneNumber: true,
              address: true,
              medicalHistory: true
            }
          },
          doctor: {
            select: {
              id: true,
              shortId: true,
              name: true,
              specialization: true,
              licenseNumber: true,
              phoneNumber: true,
              hospitalAffiliation: true
            }
          },
          medications: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (userRole === 'patient') {
      prescriptions = await prisma.prescription.findMany({
        where: { patientId: userId },
        include: {
          doctor: {
            select: {
              id: true,
              name: true,
              specialization: true,
              licenseNumber: true,
              phoneNumber: true,
              hospitalAffiliation: true
            }
          },
          patient: {
            select: {
              id: true,
              name: true,
              age: true,
              gender: true,
              email: true,
              phoneNumber: true,
              address: true,
              medicalHistory: true
            }
          },
          medications: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      res.status(403).json({ message: 'Insufficient permissions' });
      return;
    }
    
    res.status(200).json(prescriptions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ==================== Get Prescription by ID ====================
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const prescription = await prisma.prescription.findUnique({
      where: { id: req.params.id },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true
          }
        },
        medications: true
      }
    });
      
    if (!prescription) {
      res.status(404).json({ message: 'Prescription not found' });
      return;
    }
    
    // Check if the user is authorized to view this prescription
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    const isAuthorized = 
      (userRole === 'doctor' && prescription.doctorId === userId) || 
      (userRole === 'patient' && prescription.patientId === userId);
      
    if (!isAuthorized) {
      res.status(403).json({ message: 'Not authorized to view this prescription' });
      return;
    }
    
    res.status(200).json(prescription);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ==================== Update Prescription ====================
router.put(
  '/:id',
  authenticate,
  isDoctor,
  [
    body('diagnosis').optional().notEmpty().withMessage('Diagnosis cannot be empty'),
    body('medications').optional().isArray({ min: 1 }).withMessage('At least one medication is required'),
    body('medications.*.name').optional().notEmpty().withMessage('Medication name is required'),
    body('medications.*.dosage').optional().notEmpty().withMessage('Medication dosage is required'),
    body('medications.*.frequency').optional().notEmpty().withMessage('Medication frequency is required'),
    body('medications.*.duration').optional().notEmpty().withMessage('Medication duration is required'),
    body('notes').optional(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const { diagnosis, medications, notes } = req.body;
    const doctorId = (req as AuthRequest).user?.id;

    if (!doctorId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    try {
      // Verify prescription exists and belongs to the doctor
      const prescription = await prisma.prescription.findUnique({
        where: { id },
        include: { medications: true }
      });

      if (!prescription) {
        res.status(404).json({ message: 'Prescription not found' });
        return;
      }

      if (prescription.doctorId !== doctorId) {
        res.status(403).json({ message: 'Not authorized to update this prescription' });
        return;
      }

      // Update the prescription
      await prisma.$transaction(async (tx) => {
        // Update basic prescription data
        await tx.prescription.update({
          where: { id },
          data: {
            ...(diagnosis && { diagnosis }),
            ...(notes !== undefined && { notes })
          }
        });

        // If medications are provided, update them
        if (medications && medications.length > 0) {
          // Delete existing medications
          await tx.medication.deleteMany({
            where: { prescriptionId: id }
          });

          // Create new medications
          await tx.medication.createMany({
            data: medications.map((med: MedicationInput) => ({
              name: med.name,
              dosage: med.dosage,
              frequency: med.frequency,
              duration: med.duration,
              prescriptionId: id
            }))
          });
        }
      });

      // Get the updated prescription
      const updatedPrescription = await prisma.prescription.findUnique({
        where: { id },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              age: true,
              gender: true,
              email: true,
              phoneNumber: true,
              address: true,
              medicalHistory: true
            }
          },
          doctor: {
            select: {
              id: true,
              name: true,
              specialization: true,
              licenseNumber: true,
              phoneNumber: true,
              hospitalAffiliation: true
            }
          },
          medications: true
        }
      });

      res.status(200).json({ 
        message: 'Prescription updated successfully',
        prescription: updatedPrescription
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

// ==================== Delete Prescription ====================
router.delete(
  '/:id',
  authenticate,
  isDoctor,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const doctorId = (req as AuthRequest).user?.id;

    if (!doctorId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    try {
      // Verify prescription exists and belongs to the doctor
      const prescription = await prisma.prescription.findUnique({
        where: { id }
      });

      if (!prescription) {
        res.status(404).json({ message: 'Prescription not found' });
        return;
      }

      if (prescription.doctorId !== doctorId) {
        res.status(403).json({ message: 'Not authorized to delete this prescription' });
        return;
      }

      // Delete the prescription and related medications
      await prisma.$transaction(async (tx) => {
        // Delete medications first (due to foreign key constraints)
        await tx.medication.deleteMany({
          where: { prescriptionId: id }
        });

        // Delete the prescription
        await tx.prescription.delete({
          where: { id }
        });
      });

      res.status(200).json({ message: 'Prescription deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

// ==================== Filter Prescriptions ====================
router.get(
  '/filter',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      
      if (!userId || !userRole) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      const { 
        startDate, 
        endDate, 
        diagnosis, 
        medicationName 
      } = req.query;

      let whereClause: any = {};

      // Base filter by user role
      if (userRole === 'doctor') {
        whereClause.doctorId = userId;
      } else if (userRole === 'patient') {
        whereClause.patientId = userId;
      } else {
        res.status(403).json({ message: 'Insufficient permissions' });
        return;
      }

      // Add date range filter
      if (startDate && endDate) {
        whereClause.date = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        };
      } else if (startDate) {
        whereClause.date = {
          gte: new Date(startDate as string)
        };
      } else if (endDate) {
        whereClause.date = {
          lte: new Date(endDate as string)
        };
      }

      // Add diagnosis filter (partial match)
      if (diagnosis) {
        whereClause.diagnosis = {
          contains: diagnosis as string,
          mode: 'insensitive'
        };
      }

      // Filter by medication name if specified
      let prescriptions;
      if (medicationName) {
        prescriptions = await prisma.prescription.findMany({
          where: {
            ...whereClause,
            medications: {
              some: {
                name: {
                  contains: medicationName as string,
                  mode: 'insensitive'
                }
              }
            }
          },
          include: {
            patient: {
              select: {
                name: true,
                email: true
              }
            },
            doctor: {
              select: {
                name: true,
                specialization: true
              }
            },
            medications: true
          },
          orderBy: { date: 'desc' }
        });
      } else {
        prescriptions = await prisma.prescription.findMany({
          where: whereClause,
          include: {
            patient: {
              select: {
                name: true,
                email: true
              }
            },
            doctor: {
              select: {
                name: true,
                specialization: true
              }
            },
            medications: true
          },
          orderBy: { date: 'desc' }
        });
      }

      res.status(200).json(prescriptions);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

// ==================== Get Patient Prescriptions by Doctor ====================
router.get(
  '/patient/:patientId',
  authenticate,
  isDoctor,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { patientId } = req.params;
    const doctorId = req.user?.id;

    if (!doctorId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    try {
      // Check if patient exists
      const patient = await prisma.patient.findUnique({
        where: { id: patientId }
      });

      if (!patient) {
        res.status(404).json({ message: 'Patient not found' });
        return;
      }

      // Get all prescriptions for this patient by the authenticated doctor
      const prescriptions = await prisma.prescription.findMany({
        where: {
          patientId,
          doctorId
        },
        include: {
          medications: true
        },
        orderBy: { date: 'desc' }
      });

      res.status(200).json(prescriptions);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

// ==================== Get Recent Prescriptions ====================
router.get(
  '/recent',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const limit = parseInt(req.query.limit as string) || 5; // Default to 5 recent prescriptions
      
      if (!userId || !userRole) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }
      
      let whereClause: any = {};
      
      if (userRole === 'doctor') {
        whereClause.doctorId = userId;
      } else if (userRole === 'patient') {
        whereClause.patientId = userId;
      } else {
        res.status(403).json({ message: 'Insufficient permissions' });
        return;
      }
      
      const prescriptions = await prisma.prescription.findMany({
        where: whereClause,
        include: {
          patient: {
            select: {
              name: true,
              email: true
            }
          },
          doctor: {
            select: {
              name: true,
              specialization: true
            }
          },
          medications: true
        },
        orderBy: { date: 'desc' },
        take: limit
      });
      
      res.status(200).json(prescriptions);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

// ==================== Get Prescription Statistics ====================
router.get(
  '/statistics',
  authenticate,
  isDoctor,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const doctorId = req.user?.id;
    
    if (!doctorId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    try {
      // Get count of prescriptions by this doctor
      const totalPrescriptions = await prisma.prescription.count({
        where: { doctorId }
      });

      // Get count of unique patients treated by this doctor
      const uniquePatients = await prisma.prescription.findMany({
        where: { doctorId },
        select: { patientId: true },
        distinct: ['patientId']
      });

      // Get most common diagnoses
      const diagnoses = await prisma.prescription.groupBy({
        by: ['diagnosis'],
        where: { doctorId },
        _count: true,
        orderBy: {
          _count: {
            diagnosis: 'desc'
          }
        },
        take: 5
      });

      // Get most prescribed medications
      const medications = await prisma.medication.findMany({
        where: {
          prescription: {
            doctorId
          }
        },
        select: {
          name: true,
        }
      });

      // Count medication occurrences
      const medicationCounts: Record<string, number> = {};
      medications.forEach(med => {
        if (medicationCounts[med.name]) {
          medicationCounts[med.name]++;
        } else {
          medicationCounts[med.name] = 1;
        }
      });

      // Convert to array and sort
      const topMedications = Object.entries(medicationCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      res.status(200).json({
        totalPrescriptions,
        uniquePatientCount: uniquePatients.length,
        topDiagnoses: diagnoses.map(d => ({ 
          diagnosis: d.diagnosis, 
          count: d._count 
        })),
        topMedications
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

export default router;
