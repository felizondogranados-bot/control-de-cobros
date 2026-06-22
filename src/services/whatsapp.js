/**
 * WhatsApp Integration Service
 * 
 * Scalability Design:
 * - Provides utilities to format and generate WhatsApp messages for clients.
 * - Supports direct redirection via WhatsApp Web/App API links (`https://wa.me/`).
 * - Ready for integration with third-party automated APIs (like Twilio, Waba, or custom webhook bridges) in the future.
 */

/**
 * Format a WhatsApp link with a phone number and message.
 * @param {string} phone - Client's phone number.
 * @param {string} message - Message body.
 * @returns {string} Fully formed WhatsApp API URL.
 */
export function getWhatsAppLink(phone, message) {
  const cleanPhone = phone.replace(/\D/g, ''); // Keep only digits
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

/**
 * Send a debt reminder (redirects or calls webhook).
 * @param {object} client - Client data (name, phone).
 * @param {object} debt - Debt details (amount, due date).
 */
export async function sendDebtReminder(client, debt) {
  const message = `Hola ${client.name}, te recordamos que tienes un saldo pendiente de $${debt.amount} que vence el ${debt.dueDate}. Quedamos atentos a tu confirmación de pago. ¡Gracias!`;
  const url = getWhatsAppLink(client.phone, message);
  
  // For client-side redirections:
  window.open(url, '_blank');
}

/**
 * Send a payment confirmation receipt.
 * @param {object} client - Client data.
 * @param {object} payment - Payment details (amount, reference, date).
 */
export async function sendPaymentReceipt(client, payment) {
  const message = `Hola ${client.name}, hemos recibido tu pago por un monto de $${payment.amount} el día ${payment.date}. Referencia: ${payment.reference || 'N/A'}. ¡Gracias por tu pago!`;
  const url = getWhatsAppLink(client.phone, message);
  
  window.open(url, '_blank');
}
