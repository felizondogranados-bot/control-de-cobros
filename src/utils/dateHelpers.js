/**
 * Date Helpers for Financial Calculations
 * 
 * Scalability Design:
 * - Decoupled from service files, allowing offline testability and reuse in notifications.
 * - Handles local rollovers, short months (e.g., February), and standard date-formatting.
 */

/**
 * Calculates the next payment date from a starting reference date (default: today).
 * 
 * @param {string} frecuencia - 'semanal', 'quincenal', or 'mensual'.
 * @param {string} diaCobro - Day indicator.
 * @param {Date} [referenceDate] - Starting date for calculation (defaults to now).
 * @returns {Date} Calculated next payment date.
 */
export function calculateNextPaymentDate(frecuencia, diaCobro, referenceDate = new Date()) {
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  const freq = frecuencia.toLowerCase();

  if (freq === 'semanal') {
    // Map weekday names to index (0 = Sunday, 1 = Monday, etc.)
    const dayMap = {
      'domingo': 0,
      'lunes': 1,
      'martes': 2,
      'miércoles': 3,
      'miercoles': 3,
      'jueves': 4,
      'viernes': 5,
      'sábado': 6,
      'sabado': 6
    };
    
    const targetDayIndex = dayMap[diaCobro.toLowerCase()];
    if (targetDayIndex === undefined) return today;

    const currentDayIndex = today.getDay();
    let daysToAdd = targetDayIndex - currentDayIndex;
    
    // If target day is today or in the past this week, calculate for next week
    if (daysToAdd <= 0) {
      daysToAdd += 7;
    }
    
    today.setDate(today.getDate() + daysToAdd);
    return today;
  }

  if (freq === 'quincenal') {
    // Payment days are 15 and 30
    const day = today.getDate();
    const month = today.getMonth();
    const year = today.getFullYear();

    if (day < 15) {
      return new Date(year, month, 15);
    } else if (day < 30) {
      // Find the last day of the current month (in case it is February, e.g. 28/29)
      const lastDayOfCurrentMonth = new Date(year, month + 1, 0).getDate();
      const targetDay = Math.min(30, lastDayOfCurrentMonth);
      return new Date(year, month, targetDay);
    } else {
      // Return 15th of next month
      return new Date(year, month + 1, 15);
    }
  }

  if (freq === 'mensual') {
    const targetDay = Number(diaCobro);
    if (isNaN(targetDay) || targetDay < 1 || targetDay > 31) return today;

    const day = today.getDate();
    const month = today.getMonth();
    const year = today.getFullYear();

    let targetMonth = month;
    if (day >= targetDay) {
      targetMonth = month + 1;
    }

    // Adjust for shorter months (e.g., if targetDay is 31 and next month has 30 days, set to 30)
    const lastDayOfTargetMonth = new Date(year, targetMonth + 1, 0).getDate();
    const finalDay = Math.min(targetDay, lastDayOfTargetMonth);

    return new Date(year, targetMonth, finalDay);
  }

  return today;
}

/**
 * Format a Date object to YYYY-MM-DD for database inserts and form inputs.
 * @param {Date} date 
 * @returns {string} formatted string.
 */
export function formatDateToYYYYMMDD(date) {
  const d = new Date(date);
  const month = '' + (d.getMonth() + 1);
  const day = '' + d.getDate();
  const year = d.getFullYear();

  return [
    year, 
    month.padStart(2, '0'), 
    day.padStart(2, '0')
  ].join('-');
}
