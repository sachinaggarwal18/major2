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

// ==================== Update Doctor Profile ====================
router.put(
  '/profile',
  authenticate,
  isDoctor,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('specialization').optional().notEmpty().withMessage('Specialization cannot be empty'),
    body('phoneNumber')
      .optional()
      .isLength({ min: 10, max: 15 })
      .withMessage('Phone number must be valid'),
    body('hospitalAffiliation').optional(),
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

    const { name, specialization, phoneNumber, hospitalAffiliation } = req.body;

    try {
      // Check if updating phone number and it's already in use
      if (phoneNumber) {
        const existingDoctor = await prisma.doctor.findFirst({
          where: {
            phoneNumber,
            id: { not: req.user.id }
          }
        });

        if (existingDoctor) {
          res.status(400).json({ message: 'Phone number already in use' });
          return;
        }
      }

      // Update doctor profile
      const updatedDoctor = await prisma.doctor.update({
        where: { id: req.user.id },
        data: {
          ...(name && { name }),
          ...(specialization && { specialization }),
          ...(phoneNumber && { phoneNumber }),
          ...(hospitalAffiliation !== undefined && { hospitalAffiliation })
        },
        select: {
          id: true,
          name: true,
          email: true,
          specialization: true,
          phoneNumber: true,
          licenseNumber: true,
          hospitalAffiliation: true,
          updatedAt: true
        }
      });

      res.status(200).json({ 
        message: 'Profile updated successfully', 
        doctor: updatedDoctor 
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
  isDoctor,
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
      // Get current doctor with password
      const doctor = await prisma.doctor.findUnique({
        where: { id: req.user.id }
      });

      if (!doctor) {
        res.status(404).json({ message: 'Doctor not found' });
        return;
      }

      // Verify current password
      const isMatch = await argon2.verify(doctor.password, currentPassword);
      
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
      await prisma.doctor.update({
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

// ==================== Delete Doctor Account ====================
router.delete(
  '/account',
  authenticate,
  isDoctor,
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    try {
      // Delete the doctor account
      await prisma.doctor.delete({
        where: { id: req.user.id }
      });

      res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ==================== Get All Doctors ====================
router.get(
  '/all',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const doctors = await prisma.doctor.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          specialization: true,
          phoneNumber: true,
          hospitalAffiliation: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { name: 'asc' }
      });

      res.status(200).json({ doctors });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ==================== Get Doctor by ID ====================
router.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const doctor = await prisma.doctor.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          specialization: true,
          phoneNumber: true,
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
  }
);

// ==================== Search Doctors ====================
router.get(
  '/search/:query',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { query } = req.params;

      const doctors = await prisma.doctor.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { specialization: { contains: query, mode: 'insensitive' } },
            { hospitalAffiliation: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          name: true,
          email: true,
          specialization: true,
          hospitalAffiliation: true
        },
        orderBy: { name: 'asc' }
      });

      res.status(200).json({ doctors });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;
