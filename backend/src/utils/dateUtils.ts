import { addDays, addWeeks, addMonths, isValid } from 'date-fns';

/**
 * Parses a duration string (e.g., "7 days", "1 month", "3 weeks") into a number of days.
 * @param durationString The duration string.
 * @returns The number of days, or null if parsing fails.
 */
export const parseDurationToDays = (durationString: string | undefined | null): number | null => {
  if (!durationString) return null;

  const lowerCaseDuration = durationString.toLowerCase();
  const match = lowerCaseDuration.match(/(\d+)\s*(day|week|month)s?/);

  if (!match) return null;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  if (isNaN(value)) return null;

  switch (unit) {
    case 'day':
      return value;
    case 'week':
      return value * 7;
    case 'month':
      // Using an approximation for months. For more precision, consider the start date.
      // However, for general refill alerts, 30 days is usually acceptable.
      return value * 30;
    default:
      return null;
  }
};

/**
 * Calculates the end date from a start date and a duration string.
 * @param startDate The starting date (can be a Date object or a string).
 * @param durationString The duration string (e.g., "7 days", "1 month").
 * @returns The calculated end Date, or null if inputs are invalid.
 */
export const calculateEndDateFromDuration = (
  startDate: Date | string,
  durationString: string | undefined | null
): Date | null => {
  const SDate = typeof startDate === 'string' ? new Date(startDate) : startDate;
  if (!isValid(SDate)) {
    console.error('Invalid start date provided to calculateEndDateFromDuration');
    return null;
  }

  if (!durationString) return null;

  const lowerCaseDuration = durationString.toLowerCase();
  const match = lowerCaseDuration.match(/(\d+)\s*(day|week|month)s?/);

  if (!match) return null;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  if (isNaN(value)) return null;

  let endDate: Date;
  switch (unit) {
    case 'day':
      endDate = addDays(SDate, value);
      break;
    case 'week':
      endDate = addWeeks(SDate, value);
      break;
    case 'month':
      endDate = addMonths(SDate, value);
      break;
    default:
      return null;
  }
  return isValid(endDate) ? endDate : null;
};

/**
 * Finds the latest estimated end date among a list of medications in a prescription.
 * @param prescriptionDate The date the prescription was issued.
 * @param medications An array of medication objects, each with a 'duration' string.
 * @returns The latest estimated end Date, or null if no valid durations are found.
 */
export const getLatestEstimatedEndDateForPrescription = (
  prescriptionDate: Date | string,
  medications: Array<{ duration?: string | null }> | undefined | null
): Date | null => {
  if (!medications || medications.length === 0) {
    return null;
  }

  const SDate = typeof prescriptionDate === 'string' ? new Date(prescriptionDate) : prescriptionDate;
  if (!isValid(SDate)) {
    console.error('Invalid prescription date provided');
    return null;
  }

  let latestEndDate: Date | null = null;

  for (const med of medications) {
    if (med.duration) {
      const endDate = calculateEndDateFromDuration(SDate, med.duration);
      if (endDate) {
        if (!latestEndDate || endDate > latestEndDate) {
          latestEndDate = endDate;
        }
      }
    }
  }
  return latestEndDate;
};
