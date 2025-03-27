import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Prescription from '../models/prescription.model';
import { authenticate, isDoctor } from '../middleware/auth';
import { AuthRequest, PrescriptionCreateRequest } from '../types/express';
import Patient from '../models/patient.model';
import Doctor from '../models/doctor.model';
import { IDoctor, IPatient } from '../types/models';
import mongoose from 'mongoose';

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
  async (req: Request<{}, {}, PrescriptionCreateRequest>, res: Response): Promise<void> => {
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
      const patientExists = await Patient.exists({ _id: patientId });
      const doctorExists = await Doctor.exists({ _id: doctorId });

      if (!patientExists) {
        res.status(404).json({ message: 'Patient not found' });
        return;
      }

      if (!doctorExists) {
        res.status(404).json({ message: 'Doctor not found' });
        return;
      }

      const newPrescription = await Prescription.create({
        patientId,
        doctorId,
        date: date || new Date(),
        diagnosis,
        medications,
        notes
      });

      res.status(201).json({
        message: 'Prescription created successfully',
        prescriptionId: newPrescription._id
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
    // For security, limit access based on the user's role
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId || !userRole) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    
    let prescriptions;
    
    if (userRole === 'doctor') {
      prescriptions = await Prescription.find({ doctorId: userId })
        .populate('patientId', 'name email')
        .sort({ createdAt: -1 });
    } else if (userRole === 'patient') {
      prescriptions = await Prescription.find({ patientId: userId })
        .populate('doctorId', 'name specialization')
        .sort({ createdAt: -1 });
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
router.get('/:id', authenticate, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patientId', 'name email')
      .populate('doctorId', 'name specialization');
      
    if (!prescription) {
      res.status(404).json({ message: 'Prescription not found' });
      return;
    }
    
    // Check if the user is authorized to view this prescription
    const userId = (req as AuthRequest).user?.id;
    const userRole = (req as AuthRequest).user?.role;
    
    // Type assertion for populated fields
    const doctorId = (prescription.doctorId as unknown) as mongoose.Types.DocumentArray<IDoctor> & { _id: mongoose.Types.ObjectId };
    const patientId = (prescription.patientId as unknown) as mongoose.Types.DocumentArray<IPatient> & { _id: mongoose.Types.ObjectId };
    
    const isAuthorized = 
      (userRole === 'doctor' && doctorId._id.toString() === userId) || 
      (userRole === 'patient' && patientId._id.toString() === userId);
      
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