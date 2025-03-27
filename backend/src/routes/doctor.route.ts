import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { authenticate, isDoctor } from '../middleware/auth';
import { AuthRequest, DoctorSignupRequest, LoginRequest } from '../types/express';
import prisma from '../utils/prisma';

const router = express.Router();

// ==================== Doctor Signup ====================
router.post(
  '/signup',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email format'),
    body('password')
      .isLength({ min: 5 })
      .withMessage('Password must be at least 5 characters long'),
    body('specialization').notEmpty().withMessage('Specialization is required'),
    body('phoneNumber')
      .isLength({ min: 10, max: 15 })
      .withMessage('Phone number must be valid'),
    body('licenseNumber').notEmpty().withMessage('License number is required'),
  ],
  async (req: Request<Record<string, never>, unknown, DoctorSignupRequest>, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const {
      name,
      email,
      password,
      specialization,
      phoneNumber,
      licenseNumber,
      hospitalAffiliation
    } = req.body;

    try {
      const existing = await prisma.doctor.findFirst({
        where: {
          OR: [
            { email },
            { phoneNumber }
          ]
        }
      });

      if (existing) {
        res.status(400).json({ message: 'Doctor already registered' });
        return;
      }

      const hashedPassword = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 19456, // 19 MB
        timeCost: 2,
        parallelism: 1
      });

      const newDoctor = await prisma.doctor.create({
        data: {
          name,
          email,
          password: hashedPassword,
          specialization,
          phoneNumber,
          licenseNumber,
          hospitalAffiliation
        }
      });

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
      }

      const token = jwt.sign(
        { id: newDoctor.id, email: newDoctor.email, role: 'doctor' },
        jwtSecret,
        { expiresIn: '1h' }
      );

      res.status(201).json({ message: 'Doctor registered successfully', token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ==================== Doctor Login ====================
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
      const doctor = await prisma.doctor.findUnique({
        where: { email }
      });
      
      if (!doctor) {
        res.status(400).json({ message: 'Invalid email or password' });
        return;
      }

      const isMatch = await argon2.verify(doctor.password, password);
      
      if (!isMatch) {
        res.status(400).json({ message: 'Invalid email or password' });
        return;
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
      }

      const token = jwt.sign(
        { id: doctor.id, email: doctor.email, role: 'doctor' },
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

// ==================== Get Doctor Profile ====================
router.get('/profile', authenticate, isDoctor, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        specialization: true,
        phoneNumber: true,
        licenseNumber: true,
        hospitalAffiliation: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!doctor) {
      res.status(404).json({ message: 'Doctor not found' });
      return;
    }
    
    res.status(200).json({ doctor });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
