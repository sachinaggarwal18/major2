import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, isDoctor } from '../middleware/auth';
import { PrescriptionCreateRequest } from '../types/express';
import prisma from '../utils/prisma';
import { getLatestEstimatedEndDateForPrescription } from '../utils/dateUtils'; // Import the new utility

// Define medication interface to prevent 'any' type
interface MedicationInput {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string; // Optional notes for medication
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
    body('date').optional().isISO8601().toDate().withMessage('Invalid date format'),
  ],
  async (req: Request<Record<string, never>, unknown, PrescriptionCreateRequest>, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { patientShortId, diagnosis, medications, notes, date: prescriptionDateInput } = req.body;
    const doctorId = (req as Request).user?.id;

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

      const prescriptionDate = prescriptionDateInput ? new Date(prescriptionDateInput) : new Date();
      const estimatedEndDate = getLatestEstimatedEndDateForPrescription(prescriptionDate, medications);

      const newPrescription = await prisma.prescription.create({
        data: {
          patientId: patient.id,
          doctorId,
          date: prescriptionDate,
          diagnosis,
          notes,
          estimatedEndDate, // Store the calculated end date
          needsRefillSoon: false, // Default to false
          medications: {
            create: medications.map((med: MedicationInput) => ({
              name: med.name,
              dosage: med.dosage,
              frequency: med.frequency,
              duration: med.duration,
              notes: med.notes,
            }))
          }
        },
        include: { // Include all necessary fields for the response
          patient: {
            select: {
              id: true,
              shortId: true,
              name: true,
            }
          },
          doctor: {
            select: {
              id: true,
              shortId: true,
              name: true,
              specialization: true,
            }
          },
          medications: true,
        }
      });

      res.status(201).json({
        message: 'Prescription created successfully',
        prescription: newPrescription // Return the full new prescription object
      });
    } catch (error) {
      console.error('Error creating prescription:', error);
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

// ==================== Get All Prescriptions (with filtering and sorting for Doctors) ====================
// This route now implicitly includes estimatedEndDate and needsRefillSoon
// as they are part of the Prescription model.
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.type;

    if (!userId || !userRole) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const {
      patientName,
      patientShortId,
      diagnosis,
      dateFrom,
      dateTo,
      sortBy, // 'date', 'patientName'
      sortOrder, // 'asc', 'desc'
    } = req.query;

    let prescriptions;
    const includeOptions = {
      patient: {
        select: {
          id: true,
          shortId: true,
          name: true,
          age: true,
          gender: true,
        },
      },
      doctor: {
        select: {
          id: true,
          shortId: true,
          name: true,
          specialization: true,
        },
      },
      medications: true,
    };

    if (userRole === 'doctor') {
      const whereClause: any = { doctorId: userId };
      if (patientName) {
        whereClause.patient = {
          name: { contains: patientName as string, mode: 'insensitive' },
        };
      }
      if (patientShortId) {
        whereClause.patient = {
          ...(whereClause.patient ?? {}), // Preserve patientName filter if present
          shortId: patientShortId as string,
        };
      }
      if (diagnosis) {
        whereClause.diagnosis = { contains: diagnosis as string, mode: 'insensitive' };
      }
      if (dateFrom && dateTo) {
        whereClause.date = { gte: new Date(dateFrom as string), lte: new Date(dateTo as string) };
      } else if (dateFrom) {
        whereClause.date = { gte: new Date(dateFrom as string) };
      } else if (dateTo) {
        whereClause.date = { lte: new Date(dateTo as string) };
      }

      let orderByClause: any = { date: 'desc' }; // Default sort
      if (sortBy === 'date') {
        orderByClause = { date: sortOrder === 'asc' ? 'asc' : 'desc' };
      } else if (sortBy === 'patientName') {
        orderByClause = { patient: { name: sortOrder === 'asc' ? 'asc' : 'desc' } };
      }
      // Add more sortBy options as needed, e.g., by diagnosis

      prescriptions = await prisma.prescription.findMany({
        where: whereClause,
        include: includeOptions,
        orderBy: orderByClause,
      });
    } else if (userRole === 'patient') {
      // Patients get their prescriptions, sorted by date, no advanced filtering from query params
      prescriptions = await prisma.prescription.findMany({
        where: { patientId: userId },
        include: includeOptions,
        orderBy: { date: 'desc' }, // Changed from createdAt to date for consistency
      });
    } else {
      res.status(403).json({ message: 'Insufficient permissions' });
      return;
    }

    res.status(200).json(prescriptions);
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    if (error instanceof Error && (error.message.includes('Invalid `prisma.prescription.findMany()` invocation') || error.message.includes('Invalid date'))) {
      res.status(400).json({ message: 'Invalid filter parameters. Please check date formats or other inputs.' });
    } else {
      res.status(500).json({ message: 'Server Error' });
    }
  }
});

// ==================== Get Prescription by ID ====================
// This route now implicitly includes estimatedEndDate and needsRefillSoon
router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const prescription = await prisma.prescription.findUnique({
      where: { id: req.params.id },
      include: {
        patient: {
          select: {
            id: true,
            shortId: true,
            name: true,
            email: true, // Full details for single view
            age: true,
            gender: true,
            phoneNumber: true,
            address: true,
            medicalHistory: true,
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
            // hospitalAffiliation: true // Add if available and needed
          }
        },
        medications: true
      }
    });
      
    if (!prescription) {
      res.status(404).json({ message: 'Prescription not found' });
      return;
    }
    
    const userId = req.user?.id;
    const userRole = req.user?.type;
    
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
    body('date').optional().isISO8601().toDate().withMessage('Invalid date format'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const { diagnosis, medications, notes, date: prescriptionDateInput } = req.body;
    const doctorId = req.user?.id;

    if (!doctorId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    try {
      const existingPrescription = await prisma.prescription.findUnique({
        where: { id },
      });

      if (!existingPrescription) {
        res.status(404).json({ message: 'Prescription not found' });
        return;
      }

      if (existingPrescription.doctorId !== doctorId) {
        res.status(403).json({ message: 'Not authorized to update this prescription' });
        return;
      }

      const prescriptionDate = prescriptionDateInput ? new Date(prescriptionDateInput) : existingPrescription.date;
      // Recalculate estimatedEndDate if medications or date changes
      const medicationsForEndDateCalc = medications ?? (await prisma.medication.findMany({ where: { prescriptionId: id } }));
      const estimatedEndDate = getLatestEstimatedEndDateForPrescription(prescriptionDate, medicationsForEndDateCalc);

      await prisma.$transaction(async (tx) => {
        await tx.prescription.update({
          where: { id },
          data: {
            ...(diagnosis && { diagnosis }),
            ...(notes !== undefined && { notes }),
            ...(prescriptionDateInput && { date: prescriptionDate }),
            estimatedEndDate, // Update estimatedEndDate
            needsRefillSoon: false, // Reset flag for cron job to re-evaluate
          }
        });

        if (medications && medications.length > 0) {
          await tx.medication.deleteMany({
            where: { prescriptionId: id }
          });
          await tx.medication.createMany({
            data: medications.map((med: MedicationInput) => ({
              name: med.name,
              dosage: med.dosage,
              frequency: med.frequency,
              duration: med.duration,
              notes: med.notes,
              prescriptionId: id
            }))
          });
        }
      });

      const updatedPrescription = await prisma.prescription.findUnique({
        where: { id },
        include: {
          patient: { select: { id: true, shortId: true, name: true } },
          doctor: { select: { id: true, shortId: true, name: true, specialization: true } },
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
    const doctorId = req.user?.id;

    if (!doctorId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    try {
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

      // Adherence logs related to this prescription also need to be handled or deleted.
      // For now, we'll cascade delete medications, which should also handle adherence logs if schema is set up for it.
      // If not, explicit deletion of adherence logs might be needed.
      await prisma.$transaction(async (tx) => {
         await tx.medicationAdherenceLog.deleteMany({ // Explicitly delete related adherence logs
          where: { prescriptionId: id }
        });
        await tx.medication.deleteMany({
          where: { prescriptionId: id }
        });
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
// This route now implicitly includes estimatedEndDate and needsRefillSoon
router.get(
  '/filter',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.type;
      
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

      if (userRole === 'doctor') {
        whereClause.doctorId = userId;
      } else if (userRole === 'patient') {
        whereClause.patientId = userId;
      } else {
        res.status(403).json({ message: 'Insufficient permissions' });
        return;
      }

      if (startDate && endDate) {
        whereClause.date = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        };
      } else if (startDate) {
        whereClause.date = { gte: new Date(startDate as string) };
      } else if (endDate) {
        whereClause.date = { lte: new Date(endDate as string) };
      }

      if (diagnosis) {
        whereClause.diagnosis = { contains: diagnosis as string, mode: 'insensitive' };
      }
      
      const includeOptions = {
        patient: { select: { id: true, shortId: true, name: true } },
        doctor: { select: { id: true, shortId: true, name: true, specialization: true } },
        medications: true
      };

      let prescriptions;
      if (medicationName) {
        prescriptions = await prisma.prescription.findMany({
          where: {
            ...whereClause,
            medications: {
              some: { name: { contains: medicationName as string, mode: 'insensitive' } }
            }
          },
          include: includeOptions,
          orderBy: { date: 'desc' }
        });
      } else {
        prescriptions = await prisma.prescription.findMany({
          where: whereClause,
          include: includeOptions,
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
// This route now implicitly includes estimatedEndDate and needsRefillSoon
router.get(
  '/patient/:patientId',
  authenticate,
  isDoctor,
  async (req: Request, res: Response): Promise<void> => {
    const { patientId } = req.params; // This is patient's actual ID (cuid)
    const doctorId = req.user?.id;

    if (!doctorId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    try {
      const patient = await prisma.patient.findUnique({ where: { id: patientId } });
      if (!patient) {
        res.status(404).json({ message: 'Patient not found' });
        return;
      }

      const prescriptions = await prisma.prescription.findMany({
        where: { patientId, doctorId },
        include: { medications: true }, // Add other includes if needed for this specific view
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
// This route now implicitly includes estimatedEndDate and needsRefillSoon
router.get(
  '/recent',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.type;
      const limit = parseInt(req.query.limit as string) || 5;
      
      if (!userId || !userRole) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }
      
      let whereClause: any = {};
      if (userRole === 'doctor') whereClause.doctorId = userId;
      else if (userRole === 'patient') whereClause.patientId = userId;
      else {
        res.status(403).json({ message: 'Insufficient permissions' });
        return;
      }
      
      const prescriptions = await prisma.prescription.findMany({
        where: whereClause,
        include: {
          patient: { select: { id: true, shortId: true, name: true } },
          doctor: { select: { id: true, shortId: true, name: true, specialization: true } },
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
  async (req: Request, res: Response): Promise<void> => {
    const doctorId = req.user?.id;
    
    if (!doctorId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    try {
      const totalPrescriptions = await prisma.prescription.count({ where: { doctorId } });
      const uniquePatients = await prisma.prescription.findMany({
        where: { doctorId },
        select: { patientId: true },
        distinct: ['patientId']
      });
      const diagnoses = await prisma.prescription.groupBy({
        by: ['diagnosis'],
        where: { doctorId },
        _count: true,
        orderBy: { _count: { diagnosis: 'desc' } },
        take: 5
      });
      const medicationCountsResult = await prisma.medication.groupBy({
        by: ['name'],
        where: { prescription: { doctorId } },
        _count: { name: true },
        orderBy: { _count: { name: 'desc' } },
        take: 5,
      });
      const topMedications = medicationCountsResult.map(m => ({ name: m.name, count: m._count.name }));

      res.status(200).json({
        totalPrescriptions,
        uniquePatientCount: uniquePatients.length,
        topDiagnoses: diagnoses.map(d => ({ diagnosis: d.diagnosis, count: d._count })),
        topMedications
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

export default router;
