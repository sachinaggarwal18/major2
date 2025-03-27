"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const db_1 = require("./config/db");
const error_1 = require("./middleware/error");
// Import routes
const patient_route_1 = __importDefault(require("./routes/patient.route"));
const doctor_route_1 = __importDefault(require("./routes/doctor.route"));
const prescription_route_1 = __importDefault(require("./routes/prescription.route"));
// Initialize environment variables
dotenv_1.default.config();
// Initialize database connection
(0, db_1.connectToDB)();
// Create Express application
const app = (0, express_1.default)();
// Configure middlewares
app.use((0, cors_1.default)({
    origin: 'http://localhost:5173', // React frontend port
}));
app.use(express_1.default.json()); // To handle JSON data
// Register routes
app.use('/patients', patient_route_1.default);
app.use('/doctors', doctor_route_1.default);
app.use('/prescriptions', prescription_route_1.default);
// Handle 404 errors for undefined routes
app.use(error_1.notFoundHandler);
// Global error handling middleware
app.use(error_1.errorHandler);
// Start the server
const PORT = parseInt(process.env.PORT || '8000', 10);
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
