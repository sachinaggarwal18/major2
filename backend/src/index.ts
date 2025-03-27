import express, { Express } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectToDB, disconnectFromDB } from './config/db';
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

const server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// Graceful shutdown handler
const shutdown = async (): Promise<void> => {
  console.log('Shutting down server...');
  
  // Close HTTP server
  server.close(() => {
    console.log('HTTP server closed');
  });

  try {
    // Disconnect from database
    await disconnectFromDB();
    console.log('Database connections closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
  shutdown().catch(console.error);
});
