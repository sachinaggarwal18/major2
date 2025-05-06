import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
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

    const decodedToken = jwt.verify(token, jwtSecret) as { id: string; email: string; type?: 'patient' | 'doctor' };

    if (!decodedToken.type) {
      res.status(401).json({ message: 'Invalid token: user type missing' });
      return;
    }

    req.user = {
      id: decodedToken.id,
      email: decodedToken.email,
      type: decodedToken.type
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error); // Log the actual error
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Invalid or expired token' });
    } else if (error instanceof Error && error.message === 'JWT_SECRET is not defined in environment variables') {
      // This is a server configuration issue, ideally logged and handled appropriately
      res.status(500).json({ message: 'Server configuration error' });
    } 
    else {
      // For other unexpected errors, pass to the global error handler
      next(error);
    }
  }
};

export const isPatient = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.type !== 'patient') {
    res.status(403).json({ message: 'Access denied. Patient access required.' });
    return;
  }
  next();
};

export const isDoctor = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.type !== 'doctor') {
    res.status(403).json({ message: 'Access denied. Doctor access required.' });
    return;
  }
  next();
};
