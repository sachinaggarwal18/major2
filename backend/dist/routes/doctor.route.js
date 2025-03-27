"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const doctor_model_1 = __importDefault(require("../models/doctor.model"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// ==================== Doctor Signup ====================
router.post('/signup', [
    (0, express_validator_1.body)('name').trim().notEmpty().withMessage('Name is required'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Invalid email format'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 5 })
        .withMessage('Password must be at least 5 characters long'),
    (0, express_validator_1.body)('specialization').notEmpty().withMessage('Specialization is required'),
    (0, express_validator_1.body)('phoneNumber')
        .isLength({ min: 10, max: 15 })
        .withMessage('Phone number must be valid'),
    (0, express_validator_1.body)('licenseNumber').notEmpty().withMessage('License number is required'),
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { name, email, password, specialization, phoneNumber, licenseNumber, hospitalAffiliation } = req.body;
    try {
        const existing = await doctor_model_1.default.findOne({
            $or: [{ email }, { phoneNumber }],
        });
        if (existing) {
            res.status(400).json({ message: 'Doctor already registered' });
            return;
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const newDoctor = await doctor_model_1.default.create({
            name,
            email,
            password: hashedPassword,
            specialization,
            phoneNumber,
            licenseNumber,
            hospitalAffiliation
        });
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }
        const token = jsonwebtoken_1.default.sign({ id: newDoctor._id, email: newDoctor.email, role: 'doctor' }, jwtSecret, { expiresIn: '1h' });
        res.status(201).json({ message: 'Doctor registered successfully', token });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
// ==================== Doctor Login ====================
router.post('/login', [
    (0, express_validator_1.body)('email').isEmail().withMessage('Enter valid email'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 5 })
        .withMessage('Password must be at least 5 characters'),
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { email, password } = req.body;
    try {
        const doctor = await doctor_model_1.default.findOne({ email });
        if (!doctor) {
            res.status(400).json({ message: 'Invalid email or password' });
            return;
        }
        const isMatch = await bcrypt_1.default.compare(password, doctor.password);
        if (!isMatch) {
            res.status(400).json({ message: 'Invalid email or password' });
            return;
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }
        const token = jsonwebtoken_1.default.sign({ id: doctor._id, email: doctor.email, role: 'doctor' }, jwtSecret, { expiresIn: '1h' });
        res.status(200).json({ message: 'Login successful', token });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
// ==================== Get Doctor Profile ====================
router.get('/profile', auth_1.authenticate, auth_1.isDoctor, async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const doctor = await doctor_model_1.default.findById(req.user.id).select('-password');
        if (!doctor) {
            res.status(404).json({ message: 'Doctor not found' });
            return;
        }
        res.status(200).json({ doctor });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
