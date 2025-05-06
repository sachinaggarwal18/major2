import express, { Express } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectToDB, disconnectFromDB } from './config/db';
import { errorHandler, notFoundHandler } from './middleware/error';
import logger, { requestLoggingMiddleware } from './config/logger';

// Import routes
import patientRoutes from './routes/patient.route';
import doctorRoutes from './routes/doctor.route';
import prescriptionRoutes from './routes/prescription.route';
import medicationRoutes from './routes/medication.route';
import adherenceRoutes from './routes/adherence.route'; // Import adherence routes

// Initialize environment variables
dotenv.config();

// Initialize logger with app metadata
logger.info({
  app: 'eprescription-api',
  version: process.env.npm_package_version,
  nodeVersion: process.version,
  env: process.env.NODE_ENV
}, 'Application starting');

// Initialize database connection
connectToDB().catch((error) => {
  logger.fatal({ err: error }, 'Failed to connect to database. Exiting.');
  process.exit(1);
});

// Create Express application
const app: Express = express();

// Configure middlewares
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  })
);

// Add request ID and basic logging
app.use(requestLoggingMiddleware());

// Add response time tracking
app.use((req, res: express.Response, next) => {
  const startTime = process.hrtime();
  
  // Store the original end function
  const originalEnd = res.end;
  
  // Override end function to calculate response time
  res.end = (function(
    this: express.Response,
    chunk: any,
    encoding?: BufferEncoding | (() => void),
    cb?: () => void
  ) {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const responseTime = (seconds * 1000 + nanoseconds / 1e6).toFixed(2);
    
    if (!this.headersSent) {
      this.setHeader('X-Response-Time', `${responseTime}ms`);
    }
    
    if (typeof encoding === 'function') {
      cb = encoding;
      encoding = undefined;
    }
    
    return originalEnd.call(this, chunk, encoding as BufferEncoding, cb);
  }) as typeof res.end;
  
  next();
});

app.use(express.json()); // To handle JSON data

// Register routes
app.use('/patients', patientRoutes);
app.use('/doctors', doctorRoutes);
app.use('/prescriptions', prescriptionRoutes);
app.use('/medications', medicationRoutes);
app.use('/adherence', adherenceRoutes); // Register adherence routes

// Handle 404 errors for undefined routes
app.use(notFoundHandler);

// Global error handling middleware
app.use(errorHandler);

// Start the server
const PORT: number = parseInt(process.env.PORT ?? '8000', 10);

const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, `Server running at http://localhost:${PORT}`);
});

// Graceful shutdown handler
const shutdown = async (signal: string): Promise<void> => {
  logger.info({ signal }, 'Received shutdown signal. Starting graceful shutdown...');
  
  // Close HTTP server
  server.close(() => {
    logger.info('HTTP server closed');
  });

  try {
    // Disconnect from database
    await disconnectFromDB();
    logger.info('All connections closed successfully');
    process.exit(0);
  } catch (error) {
    logger.fatal({ err: error }, 'Error during shutdown');
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  logger.error(
    { 
      err: reason instanceof Error ? reason : new Error(String(reason)),
      promise
    },
    'Unhandled Promise Rejection'
  );
});

process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught Exception. Initiating shutdown...');
  shutdown('UNCAUGHT_EXCEPTION').catch((shutdownError) => {
    logger.fatal({ err: shutdownError }, 'Error during shutdown after uncaught exception');
    process.exit(1);
  });
});

// Log startup complete
logger.info('Server initialization completed');
