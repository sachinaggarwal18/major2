import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import Patient from '../models/patient.model';
import { authenticate, isPatient } from '../middleware/auth';
import { AuthRequest, PatientSignupRequest, LoginRequest } from '../types/express';

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
    body('gender').notEmpty().withMessage('Gender is required'),
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
      const existing = await Patient.findOne({
        $or: [{ email }, { phoneNumber }],
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
      const newPatient = await Patient.create({
        name,
        email,
        password: hashedPassword,
        age,
        phoneNumber,
        gender,
        address,
        medicalHistory,
      });

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
      }

      const token = jwt.sign(
        { id: newPatient._id, email: newPatient.email, role: 'patient' },
        jwtSecret,
        { expiresIn: '1h' }
      );

      res
        .status(201)
        .json({ message: 'Patient registered successfully', token });
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
      // Fetch patient and ensure password is selected if schema has select: false
      const patient = await Patient.findOne({ email }).select('+password');
      
      if (!patient) {
        res.status(400).json({ message: 'Invalid email or password' });
        return;
      }

      // Compare the plain password with the stored hashed password
      const isMatch = await argon2.verify(password, patient.password);
      
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
        { id: patient._id, email: patient.email, role: 'patient' },
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

    const patient = await Patient.findById(req.user.id).select('-password');
    
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

export default router;