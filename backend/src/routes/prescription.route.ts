import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, isDoctor } from '../middleware/auth';
import { AuthRequest, PrescriptionCreateRequest } from '../types/express';
import prisma from '../utils/prisma';

const router = express.Router();

// ==================== Create Prescription ====================
router.post(
  '/create',
  authenticate,
  isDoctor,
  [
    body('patientId').notEmpty().withMessage('Patient ID is required'),
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

    const { patientId, diagnosis, medications, notes, date } = req.body;
    const doctorId = (req as AuthRequest).user?.id;

    if (!doctorId) {
      res.status(401).json({ message: 'Doctor ID not found in token' });
      return;
    }

    try {
      // Validate that both patient and doctor exist
      const [patientExists, doctorExists] = await Promise.all([
        prisma.patient.findUnique({ where: { id: patientId } }),
        prisma.doctor.findUnique({ where: { id: doctorId } })
      ]);

      if (!patientExists) {
        res.status(404).json({ message: 'Patient not found' });
        return;
      }

      if (!doctorExists) {
        res.status(404).json({ message: 'Doctor not found' });
        return;
      }

      const newPrescription = await prisma.prescription.create({
        data: {
          patientId,
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
        prescriptionId: newPrescription.id
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
              name: true,
              email: true
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
              name: true,
              specialization: true
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

export default router;