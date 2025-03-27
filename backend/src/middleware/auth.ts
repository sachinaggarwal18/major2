import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types/express';

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const decodedToken = jwt.verify(token, jwtSecret) as { id: string; email: string; role?: 'patient' | 'doctor' };
    req.user = {
      id: decodedToken.id,
      email: decodedToken.email,
      role: decodedToken.role
    };
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const isPatient = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'patient') {
    res.status(403).json({ message: 'Access denied. Patient access required.' });
    return;
  }
  next();
};

export const isDoctor = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'doctor') {
    res.status(403).json({ message: 'Access denied. Doctor access required.' });
    return;
  }
  next();
};