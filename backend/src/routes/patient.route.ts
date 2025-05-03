import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { authenticate, isPatient, isDoctor } from '../middleware/auth';
import { AuthRequest, PatientSignupRequest, LoginRequest } from '../types/express';
import prisma from '../utils/prisma';
import { generatePatientId } from '../utils/generateId';
import upload from '../config/multer'; // Import multer configuration
import fs from 'fs'; // Import fs for file deletion
import path from 'path'; // Import path for file deletion

const router = express.Router();

// ==================== Patient Signup ====================
router.post(
  '/signup',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email format'),
    body('password')
      .isLength({ min: 5 })
      .withMessage('Password must be at least 5 characters long'),
    body('age').isInt({ min: 1 }).withMessage('Age must be a positive number'),
    body('phoneNumber')
      .isLength({ min: 10, max: 15 })
      .withMessage('Phone number must be valid'),
    body('gender')
      .isIn(['Male', 'Female', 'Other'])
      .withMessage('Gender must be Male, Female, or Other'),
    body('address').trim().notEmpty().withMessage('Address is required'),
  ],
  async (req: Request<Record<string, never>, unknown, PatientSignupRequest>, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { name, email, password, age, phoneNumber, gender, address, medicalHistory } = req.body;

    try {
      // Check if patient already exists
      const existing = await prisma.patient.findFirst({
        where: {
          OR: [
            { email },
            { phoneNumber }
          ]
        }
      });

      if (existing) {
        res.status(400).json({ message: 'Patient already registered' });
        return;
      }

      // Hash the password before saving
      const hashedPassword = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 19456, // 19 MB
        timeCost: 2,
        parallelism: 1
      });

      // Save the patient with hashed password
      // Generate unique short ID for the patient
      const shortId = await generatePatientId();

      const newPatient = await prisma.patient.create({
        data: {
          shortId,
          name,
          email,
          password: hashedPassword,
          age,
          phoneNumber,
          gender: gender as 'Male' | 'Female' | 'Other',
          address,
          medicalHistory
        }
      });

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
      }

      const token = jwt.sign(
        { id: newPatient.id, email: newPatient.email, role: 'patient' },
        jwtSecret,
        { expiresIn: '1h' }
      );

      res.status(201).json({ message: 'Patient registered successfully', token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ==================== Patient Login ====================
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Enter valid email'),
    body('password')
      .isLength({ min: 5 })
      .withMessage('Password must be at least 5 characters'),
  ],
  async (req: Request<Record<string, never>, unknown, LoginRequest>, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password } = req.body;

    try {
      const patient = await prisma.patient.findUnique({
        where: { email }
      });
      
      if (!patient) {
        res.status(400).json({ message: 'Invalid email or password' });
        return;
      }

      // Compare the plain password with the stored hashed password
      const isMatch = await argon2.verify(patient.password, password);
      
      if (!isMatch) {
        res.status(400).json({ message: 'Invalid email or password' });
        return;
      }

      // Generate JWT token on successful login
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
      }

      const token = jwt.sign(
        { id: patient.id, email: patient.email, role: 'patient' },
        jwtSecret,
        { expiresIn: '1h' }
      );

      res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ==================== Get Patient Profile ====================
router.get('/profile', authenticate, isPatient, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const patient = await prisma.patient.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        shortId: true,
        name: true,
        email: true,
        age: true,
        gender: true,
        phoneNumber: true,
        address: true,
        medicalHistory: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!patient) {
      res.status(404).json({ message: 'Patient not found' });
      return;
    }
    
    res.status(200).json({ patient });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== Update Patient Profile ====================
router.put(
  '/profile',
  authenticate,
  isPatient,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('age').optional().isInt({ min: 1 }).withMessage('Age must be a positive number'),
    body('phoneNumber')
      .optional()
      .isLength({ min: 10, max: 15 })
      .withMessage('Phone number must be valid'),
    body('gender')
      .optional()
      .isIn(['Male', 'Female', 'Other'])
      .withMessage('Gender must be Male, Female, or Other'),
    body('address').optional().trim().notEmpty().withMessage('Address cannot be empty'),
    body('medicalHistory').optional(),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { name, age, phoneNumber, gender, address, medicalHistory } = req.body;

    try {
      // Check if updating phone number and it's already in use
      if (phoneNumber) {
        const existingPatient = await prisma.patient.findFirst({
          where: {
            phoneNumber,
            id: { not: req.user.id }
          }
        });

        if (existingPatient) {
          res.status(400).json({ message: 'Phone number already in use' });
          return;
        }
      }

      // Update patient profile
      const updatedPatient = await prisma.patient.update({
        where: { id: req.user.id },
        data: {
          ...(name && { name }),
          ...(age && { age }),
          ...(phoneNumber && { phoneNumber }),
          ...(gender && { gender: gender as 'Male' | 'Female' | 'Other' }),
          ...(address && { address }),
          ...(medicalHistory !== undefined && { medicalHistory })
        },
        select: {
          id: true,
          name: true,
          email: true,
          age: true,
          gender: true,
          phoneNumber: true,
          address: true,
          medicalHistory: true,
          updatedAt: true
        }
      });

      res.status(200).json({ 
        message: 'Profile updated successfully', 
        patient: updatedPatient 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ==================== Change Password ====================
router.put(
  '/change-password',
  authenticate,
  isPatient,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 5 })
      .withMessage('New password must be at least 5 characters long')
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    try {
      // Get current patient with password
      const patient = await prisma.patient.findUnique({
        where: { id: req.user.id }
      });

      if (!patient) {
        res.status(404).json({ message: 'Patient not found' });
        return;
      }

      // Verify current password
      const isMatch = await argon2.verify(patient.password, currentPassword);
      
      if (!isMatch) {
        res.status(400).json({ message: 'Current password is incorrect' });
        return;
      }

      // Hash the new password
      const hashedPassword = await argon2.hash(newPassword, {
        type: argon2.argon2id,
        memoryCost: 19456, // 19 MB
        timeCost: 2,
        parallelism: 1
      });

      // Update password
      await prisma.patient.update({
        where: { id: req.user.id },
        data: { password: hashedPassword }
      });

      res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ==================== Delete Patient Account ====================
router.delete(
  '/account',
  authenticate,
  isPatient,
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    try {
      // Delete the patient account
      await prisma.patient.delete({
        where: { id: req.user.id }
      });

      res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ==================== Get All Patients (Doctor Only) ====================
router.get(
  '/all',
  authenticate,
  isDoctor,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const patients = await prisma.patient.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          age: true,
          gender: true,
          phoneNumber: true,
          address: true,
          medicalHistory: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { name: 'asc' }
      });

      res.status(200).json({ patients });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ==================== Get Patient by ID (Doctor Only) ====================
// ==================== Find Patient by Short ID (Doctor Only) ====================
router.get(
  '/find/:shortId',
  authenticate,
  isDoctor,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { shortId } = req.params;

      const patient = await prisma.patient.findUnique({
        where: { shortId },
        select: {
          id: true,
          name: true,
          email: true,
          age: true,
          gender: true,
          phoneNumber: true,
          address: true,
          medicalHistory: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!patient) {
        res.status(404).json({ message: 'Patient not found' });
        return;
      }

      res.status(200).json({ patient });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ==================== Search Patients (Doctor Only) ====================
router.get(
  '/search/:query',
  authenticate,
  isDoctor,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { query } = req.params;

      const patients = await prisma.patient.findMany({
        where: {
          OR: [
            { shortId: { contains: query.toUpperCase() } },
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { address: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          shortId: true,
          name: true,
          email: true,
          age: true,
          gender: true,
          phoneNumber: true
        }
      });

      res.status(200).json({ patients });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ==================== Upload Prescription File ====================
router.post(
  '/upload-prescription',
  authenticate,
  isPatient,
  upload.single('prescriptionFile'), // Use multer middleware for single file upload named 'prescriptionFile'
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const { notes } = req.body; // Optional notes from the form

    try {
      const uploadedPrescription = await prisma.uploadedPrescription.create({
        data: {
          patientId: req.user.id,
          filename: req.file.originalname,
          storagePath: req.file.path, // Store the path where multer saved the file
          fileType: req.file.mimetype,
          notes: notes || null,
        },
      });

      res.status(201).json({
        message: 'Prescription uploaded successfully',
        prescription: uploadedPrescription,
      });
    } catch (error) {
      console.error('Error uploading prescription:', error);
      // If database write fails, attempt to delete the orphaned file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting orphaned file:', err);
      });
      res.status(500).json({ message: 'Server error during upload' });
    }
  }
);

// ==================== Get Uploaded Prescriptions for Patient ====================
router.get(
  '/uploaded-prescriptions',
  authenticate,
  isPatient,
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    try {
      const prescriptions = await prisma.uploadedPrescription.findMany({
        where: { patientId: req.user.id },
        orderBy: { uploadDate: 'desc' },
      });
      res.status(200).json({ prescriptions });
    } catch (error) {
      console.error('Error fetching uploaded prescriptions:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ==================== Delete Uploaded Prescription ====================
router.delete(
  '/uploaded-prescriptions/:id',
  authenticate,
  isPatient,
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    try {
      // Find the prescription record to get the file path
      const prescription = await prisma.uploadedPrescription.findUnique({
        where: { id },
      });

      if (!prescription) {
        res.status(404).json({ message: 'Uploaded prescription not found' });
        return;
      }

      // Check if the prescription belongs to the logged-in patient
      if (prescription.patientId !== req.user.id) {
        res.status(403).json({ message: 'Not authorized to delete this prescription' });
        return;
      }

      // Delete the file from storage
      fs.unlink(prescription.storagePath, async (err) => {
        if (err) {
          // Log error but proceed to delete DB record anyway, maybe file was already deleted
          console.error('Error deleting file from storage:', err);
        }
        
        // Delete the record from the database
        await prisma.uploadedPrescription.delete({
          where: { id },
        });

        res.status(200).json({ message: 'Uploaded prescription deleted successfully' });
      });

    } catch (error) {
      console.error('Error deleting uploaded prescription:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);


export default router;
