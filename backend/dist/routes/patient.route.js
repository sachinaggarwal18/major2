"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const patient_model_1 = __importDefault(require("../models/patient.model"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// ==================== Patient Signup ====================
router.post('/signup', [
    (0, express_validator_1.body)('name').trim().notEmpty().withMessage('Name is required'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Invalid email format'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 5 })
        .withMessage('Password must be at least 5 characters long'),
    (0, express_validator_1.body)('age').isInt({ min: 1 }).withMessage('Age must be a positive number'),
    (0, express_validator_1.body)('phoneNumber')
        .isLength({ min: 10, max: 15 })
        .withMessage('Phone number must be valid'),
    (0, express_validator_1.body)('gender').notEmpty().withMessage('Gender is required'),
    (0, express_validator_1.body)('address').trim().notEmpty().withMessage('Address is required'),
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { name, email, password, age, phoneNumber, gender, address, medicalHistory } = req.body;
    try {
        // Check if patient already exists
        const existing = await patient_model_1.default.findOne({
            $or: [{ email }, { phoneNumber }],
        });
        if (existing) {
            res.status(400).json({ message: 'Patient already registered' });
            return;
        }
        // Hash the password before saving
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        // Save the patient with hashed password
        const newPatient = await patient_model_1.default.create({
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
        const token = jsonwebtoken_1.default.sign({ id: newPatient._id, email: newPatient.email, role: 'patient' }, jwtSecret, { expiresIn: '1h' });
        res
            .status(201)
            .json({ message: 'Patient registered successfully', token });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
// ==================== Patient Login ====================
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
        // Fetch patient and ensure password is selected if schema has select: false
        const patient = await patient_model_1.default.findOne({ email }).select('+password');
        if (!patient) {
            res.status(400).json({ message: 'Invalid email or password' });
            return;
        }
        // Compare the plain password with the stored hashed password
        const isMatch = await bcrypt_1.default.compare(password, patient.password);
        if (!isMatch) {
            res.status(400).json({ message: 'Invalid email or password' });
            return;
        }
        // Generate JWT token on successful login
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }
        const token = jsonwebtoken_1.default.sign({ id: patient._id, email: patient.email, role: 'patient' }, jwtSecret, { expiresIn: '1h' });
        res.status(200).json({ message: 'Login successful', token });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
// ==================== Get Patient Profile ====================
router.get('/profile', auth_1.authenticate, auth_1.isPatient, async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const patient = await patient_model_1.default.findById(req.user.id).select('-password');
        if (!patient) {
            res.status(404).json({ message: 'Patient not found' });
            return;
        }
        res.status(200).json({ patient });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
