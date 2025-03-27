"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDoctor = exports.isPatient = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticate = (req, res, next) => {
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
        const decodedToken = jsonwebtoken_1.default.verify(token, jwtSecret);
        req.user = {
            id: decodedToken.id,
            email: decodedToken.email,
            role: decodedToken.role
        };
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};
exports.authenticate = authenticate;
const isPatient = (req, res, next) => {
    if (req.user?.role !== 'patient') {
        res.status(403).json({ message: 'Access denied. Patient access required.' });
        return;
    }
    next();
};
exports.isPatient = isPatient;
const isDoctor = (req, res, next) => {
    if (req.user?.role !== 'doctor') {
        res.status(403).json({ message: 'Access denied. Doctor access required.' });
        return;
    }
    next();
};
exports.isDoctor = isDoctor;
