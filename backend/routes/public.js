import express from 'express';
import DemoLead from '../models/DemoLead.js';
import Category from '../models/Category.js';
import { emitDemo } from '../services/eventBus.js';
import { sendBookingConfirmation, sendAlreadyRequestedConfirmation } from '../services/chatbot.js';
import logger from '../services/logger.js';

const router = express.Router();

// Normalize a phone to WhatsApp digits-only format (India default).
function normalizeWaPhone(raw) {
  let d = (raw || '').replace(/\D/g, '');
  if (!d) return '';
  d = d.replace(/^0+/, '');
  if (d.length === 10) d = `91${d}`;
  return d;
}

// Public: categories for the website contact/demo form dropdown.
router.get('/categories', async (_req, res) => {
  const cats = await Category.find({ active: true }).sort({ order: 1, createdAt: 1 }).select('name slug imageUrl').lean();
  res.json({ success: true, data: cats });
});

// Public: book a demo from the website contact form.
router.post('/demo/book', async (req, res) => {
  try {
    const { name, businessName, businessAddress, category, whatsappNumber, altMobile, email } = req.body || {};
    if (!name?.trim() || !businessName?.trim() || !whatsappNumber?.trim()) {
      return res.status(400).json({ success: false, message: 'Please fill name, business name and WhatsApp number.' });
    }
    const phone = normalizeWaPhone(whatsappNumber);
    if (phone.length < 12) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit WhatsApp number.' });
    }

    const existing = await DemoLead.findOne({ phone }).lean();
    if (existing) {
      // Notify them on WhatsApp that they've already requested a demo.
      sendAlreadyRequestedConfirmation(phone).catch((e) => logger.warn('already-requested send failed', { error: e.message }));
      return res.json({
        success: true,
        alreadyRequested: true,
        message: 'You have already requested a demo. Our team will contact you shortly.'
      });
    }

    const lead = await DemoLead.create({
      phone,
      name: name.trim(),
      businessName: businessName.trim(),
      businessAddress: (businessAddress || '').trim(),
      category: (category || '').trim(),
      altMobile: (altMobile || '').trim(),
      email: (email || '').trim(),
      source: 'website',
      status: 'New'
    });
    emitDemo(lead);
    // Fire the WhatsApp booking confirmation (template if approved, else session message).
    sendBookingConfirmation(phone).catch((e) => logger.warn('booking confirmation failed', { error: e.message }));
    res.status(201).json({ success: true, message: 'Demo request received! Our team will reach out shortly.' });
  } catch (err) {
    if (err.code === 11000) {
      return res.json({ success: true, alreadyRequested: true, message: 'You have already requested a demo.' });
    }
    logger.error('website demo book failed', { error: err.message });
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

export default router;
