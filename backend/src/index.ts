import express, { Express } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectToDB } from './config/db';
import { errorHandler, notFoundHandler } from './middleware/error';

// Import routes
import patientRoutes from './routes/patient.route';
import doctorRoutes from './routes/doctor.route';
import prescriptionRoutes from './routes/prescription.route';

// Initialize environment variables
dotenv.config();

// Initialize database connection
connectToDB();

// Create Express application
const app: Express = express();

// Configure middlewares
app.use(
  cors({
    origin: 'http://localhost:5173', // React frontend port
  })
);

app.use(express.json()); // To handle JSON data

// Register routes
app.use('/patients', patientRoutes);
app.use('/doctors', doctorRoutes);
app.use('/prescriptions', prescriptionRoutes);

// Handle 404 errors for undefined routes
app.use(notFoundHandler);

// Global error handling middleware
app.use(errorHandler);

// Start the server
const PORT: number = parseInt(process.env.PORT || '8000', 10);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});