import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth';
import prisma from '../utils/prisma';

const router = express.Router();

// ==================== Log Medication Dose Taken ====================
router.post(
  '/log',
  authenticate, // Ensure user is logged in (should be patient)
  [
    body('prescriptionId').isUUID().withMessage('Valid Prescription ID is required'),
    body('medicationId').isUUID().withMessage('Valid Medication ID is required'),
    body('takenAt').optional().isISO8601().toDate().withMessage('Invalid date format for takenAt'),
    body('notes').optional().isString().trim().escape(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    // Ensure it's a patient making the request
    if (req.user?.type !== 'patient') {
      res.status(403).json({ message: 'Forbidden: Only patients can log adherence' });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { prescriptionId, medicationId, notes } = req.body;
    const takenAt = req.body.takenAt ? new Date(req.body.takenAt) : new Date(); // Use provided time or now
    const patientId = req.user.id;

    try {
      // Optional: Verify the medication belongs to the prescription and the prescription belongs to the patient
      const medication = await prisma.medication.findUnique({
        where: { id: medicationId },
        select: { prescriptionId: true, prescription: { select: { patientId: true } } },
      });

      if (!medication || medication.prescriptionId !== prescriptionId || medication.prescription.patientId !== patientId) {
        res.status(404).json({ message: 'Medication or Prescription not found or does not belong to the patient' });
        return;
      }

      // Create the adherence log entry
      const logEntry = await prisma.medicationAdherenceLog.create({
        data: {
          patientId,
          prescriptionId,
          medicationId,
          takenAt,
          notes,
        },
      });

      res.status(201).json({ message: 'Adherence logged successfully', logEntry });

    } catch (error) {
      console.error('Error logging medication adherence:', error);
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

// ==================== Get Adherence History for Patient ====================
router.get(
  '/history',
  authenticate, // Ensure user is logged in (patient)
  async (req: Request, res: Response): Promise<void> => {
    // Ensure it's a patient making the request
    if (req.user?.type !== 'patient') {
      res.status(403).json({ message: 'Forbidden: Only patients can view their adherence history' });
      return;
    }

    const patientId = req.user.id;
    const { prescriptionId, medicationId, limit = 50, page = 1 } = req.query; // Add pagination and filtering

    const take = parseInt(limit as string, 10) || 50;
    const skip = (parseInt(page as string, 10) - 1) * take;

    try {
      const whereClause: any = { patientId };
      if (prescriptionId && typeof prescriptionId === 'string') {
        whereClause.prescriptionId = prescriptionId;
      }
      if (medicationId && typeof medicationId === 'string') {
        whereClause.medicationId = medicationId;
      }

      const totalLogs = await prisma.medicationAdherenceLog.count({ where: whereClause });
      const logs = await prisma.medicationAdherenceLog.findMany({
        where: whereClause,
        orderBy: {
          takenAt: 'desc', // Show most recent first
        },
        take: take,
        skip: skip,
        include: {
          // Include medication details for context
          medication: {
            select: { name: true, dosage: true },
          },
        },
      });

      res.status(200).json({ 
        logs,
        pagination: {
          total: totalLogs,
          page: parseInt(page as string, 10),
          limit: take,
          totalPages: Math.ceil(totalLogs / take)
        }
      });

    } catch (error) {
      console.error('Error fetching adherence history:', error);
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

export default router;
