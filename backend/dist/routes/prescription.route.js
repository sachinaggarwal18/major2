"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const prescription_model_1 = __importDefault(require("../models/prescription.model"));
const auth_1 = require("../middleware/auth");
const patient_model_1 = __importDefault(require("../models/patient.model"));
const doctor_model_1 = __importDefault(require("../models/doctor.model"));
const router = express_1.default.Router();
// ==================== Create Prescription ====================
router.post('/create', auth_1.authenticate, auth_1.isDoctor, [
    (0, express_validator_1.body)('patientId').notEmpty().withMessage('Patient ID is required'),
    (0, express_validator_1.body)('diagnosis').notEmpty().withMessage('Diagnosis is required'),
    (0, express_validator_1.body)('medications').isArray({ min: 1 }).withMessage('Medications must be provided'),
    (0, express_validator_1.body)('medications.*.name').notEmpty().withMessage('Medication name is required'),
    (0, express_validator_1.body)('medications.*.dosage').notEmpty().withMessage('Medication dosage is required'),
    (0, express_validator_1.body)('medications.*.frequency').notEmpty().withMessage('Medication frequency is required'),
    (0, express_validator_1.body)('medications.*.duration').notEmpty().withMessage('Medication duration is required'),
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { patientId, diagnosis, medications, notes, date } = req.body;
    const doctorId = req.user?.id;
    if (!doctorId) {
        res.status(401).json({ message: 'Doctor ID not found in token' });
        return;
    }
    try {
        // Validate that both patient and doctor exist
        const patientExists = await patient_model_1.default.exists({ _id: patientId });
        const doctorExists = await doctor_model_1.default.exists({ _id: doctorId });
        if (!patientExists) {
            res.status(404).json({ message: 'Patient not found' });
            return;
        }
        if (!doctorExists) {
            res.status(404).json({ message: 'Doctor not found' });
            return;
        }
        const newPrescription = await prescription_model_1.default.create({
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
    }
    catch (error) {
        console.error('Error creating prescription:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});
// ==================== Get All Prescriptions ====================
router.get('/', auth_1.authenticate, async (req, res) => {
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
            prescriptions = await prescription_model_1.default.find({ doctorId: userId })
                .populate('patientId', 'name email')
                .sort({ createdAt: -1 });
        }
        else if (userRole === 'patient') {
            prescriptions = await prescription_model_1.default.find({ patientId: userId })
                .populate('doctorId', 'name specialization')
                .sort({ createdAt: -1 });
        }
        else {
            res.status(403).json({ message: 'Insufficient permissions' });
            return;
        }
        res.status(200).json(prescriptions);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});
// ==================== Get Prescription by ID ====================
router.get('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const prescription = await prescription_model_1.default.findById(req.params.id)
            .populate('patientId', 'name email')
            .populate('doctorId', 'name specialization');
        if (!prescription) {
            res.status(404).json({ message: 'Prescription not found' });
            return;
        }
        // Check if the user is authorized to view this prescription
        const userId = req.user?.id;
        const userRole = req.user?.role;
        // Type assertion for populated fields
        const doctorId = prescription.doctorId;
        const patientId = prescription.patientId;
        const isAuthorized = (userRole === 'doctor' && doctorId._id.toString() === userId) ||
            (userRole === 'patient' && patientId._id.toString() === userId);
        if (!isAuthorized) {
            res.status(403).json({ message: 'Not authorized to view this prescription' });
            return;
        }
        res.status(200).json(prescription);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.default = router;
