import cron from 'node-cron';
import prisma from '../utils/prisma';
import { differenceInDays, isFuture } from 'date-fns';
import logger from '../config/logger'; // Assuming you have a logger

const REFILL_THRESHOLD_DAYS = 7; // Prescriptions ending within 7 days

/**
 * Updates the 'needsRefillSoon' flag for prescriptions.
 * This function is intended to be run by a cron job.
 */
export const updateRefillAlerts = async (): Promise<void> => {
  logger.info('Starting scheduled job: updateRefillAlerts');
  try {
    const prescriptions = await prisma.prescription.findMany({
      where: {
        estimatedEndDate: {
          not: null, // Only consider prescriptions with an estimated end date
        },
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to the start of the day for consistent comparison

    let updatedCount = 0;

    for (const p of prescriptions) {
      if (!p.estimatedEndDate) continue; // Should be filtered by query, but as a safeguard

      const endDate = new Date(p.estimatedEndDate);
      endDate.setHours(0,0,0,0); // Normalize for comparison

      const daysUntilEnd = differenceInDays(endDate, today);
      
      // Determine the correct 'needsRefillSoon' status
      // It should be true if the prescription is active (not past) and ends within the threshold.
      // Otherwise, it should be false.
      const newNeedsRefillSoonStatus = isFuture(endDate) && // isFuture checks if date > today (after normalization)
                                       daysUntilEnd >= 0 && // Ensure it's not already past by a fraction of a day before normalization
                                       daysUntilEnd <= REFILL_THRESHOLD_DAYS;

      // Update only if the status has changed
      if (p.needsRefillSoon !== newNeedsRefillSoonStatus) {
        await prisma.prescription.update({
          where: { id: p.id },
          data: { needsRefillSoon: newNeedsRefillSoonStatus },
        });
        updatedCount++;
        logger.debug(`Prescription ${p.id} 'needsRefillSoon' updated to ${newNeedsRefillSoonStatus}. Original: ${p.needsRefillSoon}. Days until end: ${daysUntilEnd}`);
      }
    }
    logger.info(`Finished updateRefillAlerts job. ${updatedCount} prescriptions updated.`);
  } catch (error) {
    logger.error('Error in updateRefillAlerts scheduled job:', error);
  }
};

/**
 * Schedules the cron job to update refill alerts.
 * Runs once a day at 1:00 AM server time.
 */
export const scheduleRefillAlertUpdater = (): void => {
  // cron.schedule('*/10 * * * * *', () => { // For testing: every 10 seconds
  cron.schedule('0 1 * * *', () => { // Runs every day at 1:00 AM
    logger.info('Cron job triggered: updateRefillAlerts');
    void updateRefillAlerts();
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Set to your server's timezone or a relevant one
  });

  logger.info('Refill alert updater job scheduled to run daily at 1:00 AM.');
};
