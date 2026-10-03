// Razorpay REST client (no SDK dependency) — dynamic UPI QR codes + payment links.
import axios from 'axios';
import crypto from 'crypto';
import logger from './logger.js';

const BASE = 'https://api.razorpay.com/v1';

function auth() {
  const id = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  return { username: id, password: secret };
}

function configured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

const toPaise = (rupees) => Math.round(Number(rupees) * 100);

const razorpay = {
  configured,

  // Create a dynamic UPI QR for a fixed amount. Returns { id, image_url }.
  async createQrCode({ amount, description, referenceId, closeBy }) {
    const payload = {
      type: 'upi_qr',
      name: process.env.BUSINESS_NAME || 'Kapso Solutions',
      usage: 'single_use',
      fixed_amount: true,
      payment_amount: toPaise(amount),
      description: description || 'Invoice payment',
      notes: { reference_id: String(referenceId || '') }
    };
    if (closeBy) payload.close_by = closeBy; // unix seconds (optional)
    const { data } = await axios.post(`${BASE}/payments/qr_codes`, payload, { auth: auth() });
    return data;
  },

  async closeQrCode(qrId) {
    try {
      await axios.post(`${BASE}/payments/qr_codes/${qrId}/close`, {}, { auth: auth() });
    } catch (e) {
      logger.debug('closeQrCode failed', { error: e.response?.data?.error?.description || e.message });
    }
  },

  // Create a payment link. Returns { id, short_url }.
  async createPaymentLink({ amount, description, referenceId, customer, callbackUrl }) {
    const payload = {
      amount: toPaise(amount),
      currency: 'INR',
      accept_partial: false,
      description: description || 'Invoice payment',
      reference_id: String(referenceId || ''),
      customer: {
        name: customer?.name || '',
        email: customer?.email || '',
        contact: customer?.contact || ''
      },
      notify: { sms: false, email: Boolean(customer?.email) },
      reminder_enable: true,
      notes: { reference_id: String(referenceId || '') }
    };
    if (callbackUrl) {
      payload.callback_url = callbackUrl;
      payload.callback_method = 'get';
    }
    const { data } = await axios.post(`${BASE}/payment_links`, payload, { auth: auth() });
    return data;
  },

  async getPayment(paymentId) {
    const { data } = await axios.get(`${BASE}/payments/${paymentId}`, { auth: auth() });
    return data;
  },

  // Verify a Razorpay webhook signature (HMAC SHA256 of the raw body).
  verifyWebhookSignature(rawBody, signature) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return false;
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature || ''));
    } catch {
      return false;
    }
  }
};

export default razorpay;
