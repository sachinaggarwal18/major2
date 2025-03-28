import prisma from '../utils/prisma';
import logger from './logger';

export async function connectToDB(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Connected to PostgreSQL database');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error({ err: error }, `Database connection error: ${errorMessage}`);
    process.exit(1);
  }
}

export async function disconnectFromDB(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Disconnected from PostgreSQL database');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error({ err: error }, `Database disconnection error: ${errorMessage}`);
  }
}

import { Prisma } from '@prisma/client';

// Add middleware for logging Prisma queries in development
export const prismaLoggingMiddleware: Prisma.Middleware = async (params, next) => {
  const before = Date.now();

  const result = await next(params);

  const after = Date.now();
  const time = after - before;

  if (process.env.NODE_ENV === 'development') {
    logger.debug({
      action: params.action,
      model: params.model,
      args: params.args,
      duration: `${time}ms`
    }, 'Prisma Query');
  }

  return result;
};

 // Configure Prisma with query logging
if (process.env.NODE_ENV === 'development') {
prisma.$use(prismaLoggingMiddleware);
}

export default { connectToDB, disconnectFromDB };
