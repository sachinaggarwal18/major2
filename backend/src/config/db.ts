import prisma from '../utils/prisma';

export async function connectToDB(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('Connected to PostgreSQL database');
  } catch (error: unknown) {
    console.error('Database connection error:', error instanceof Error ? error.message : 'Unknown error occurred');
    process.exit(1);
  }
}

export async function disconnectFromDB(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('Disconnected from PostgreSQL database');
  } catch (error: unknown) {
    console.error('Database disconnection error:', error instanceof Error ? error.message : 'Unknown error occurred');
  }
}

export default { connectToDB, disconnectFromDB };
