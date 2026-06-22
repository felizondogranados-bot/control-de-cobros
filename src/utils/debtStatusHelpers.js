/**
 * Helper utilities to compute dynamic status and metrics for debts.
 */

/**
 * Computes the status of a debt based on its current values and dates.
 * A debt is 'vencida' if:
 * - Current date (midnight local) > proxima_fecha_pago
 * - saldo_pendiente > 0
 * - estado !== 'pagada'
 * - estado !== 'cancelada'
 * 
 * @param {object} deuda - Debt object from Supabase.
 * @returns {'activa' | 'pagada' | 'cancelada' | 'vencida'} Dynamic status string.
 */
export function getDebtStatus(deuda) {
  if (deuda.estado === 'pagada') return 'pagada';
  if (deuda.estado === 'cancelada') return 'cancelada';

  if (deuda.proxima_fecha_pago && Number(deuda.saldo_pendiente) > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [year, month, day] = deuda.proxima_fecha_pago.split('-').map(Number);
    const dueDate = new Date(year, month - 1, day);
    dueDate.setHours(0, 0, 0, 0);

    if (today > dueDate) {
      return 'vencida';
    }
  }

  return 'activa';
}

/**
 * Calculates the number of overdue days for a debt.
 * 
 * @param {string} proximaFechaPago - Due date string in YYYY-MM-DD format.
 * @returns {number} Number of overdue days, or 0 if not overdue.
 */
export function getDiasAtraso(proximaFechaPago) {
  if (!proximaFechaPago) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = proximaFechaPago.split('-').map(Number);
  const dueDate = new Date(year, month - 1, day);
  dueDate.setHours(0, 0, 0, 0);

  if (today <= dueDate) return 0;

  const diffTime = Math.abs(today - dueDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}
