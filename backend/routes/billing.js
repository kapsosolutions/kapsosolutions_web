import express from 'express';
import { requireAdmin } from '../middleware/auth.js';
import Client from '../models/Client.js';
import Invoice from '../models/Invoice.js';
import razorpay from '../services/razorpay.js';
import logger from '../services/logger.js';

const router = express.Router();
router.use(requireAdmin);

// ================= Clients =================
router.get('/clients', async (_req, res) => {
  const clients = await Client.find().sort({ createdAt: -1 });
  res.json({ success: true, data: clients });
});

router.post('/clients', async (req, res) => {
  try {
    const { businessName } = req.body || {};
    if (!businessName?.trim()) return res.status(400).json({ success: false, message: 'Business name is required' });
    const client = await Client.create({
      businessName: businessName.trim(),
      whatsapp: (req.body.whatsapp || '').replace(/\D/g, ''),
      phone: req.body.phone || '',
      email: req.body.email || '',
      category: req.body.category || '',
      address: req.body.address || '',
      setupCost: Number(req.body.setupCost) || 0,
      monthlyCharge: Number(req.body.monthlyCharge) || 0,
      notes: req.body.notes || ''
    });
    res.status(201).json({ success: true, data: client });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/clients/:id', async (req, res) => {
  try {
    const update = { ...req.body };
    if (update.whatsapp !== undefined) update.whatsapp = String(update.whatsapp).replace(/\D/g, '');
    if (update.setupCost !== undefined) update.setupCost = Number(update.setupCost) || 0;
    if (update.monthlyCharge !== undefined) update.monthlyCharge = Number(update.monthlyCharge) || 0;
    const client = await Client.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!client) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: client });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/clients/:id', async (req, res) => {
  const c = await Client.findByIdAndDelete(req.params.id);
  if (!c) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, message: 'Deleted' });
});

// ================= Invoices =================
function computeTotals(items, taxType, taxRate) {
  const subtotal = (items || []).reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const rate = taxType === 'NONE' ? 0 : Number(taxRate) || 0;
  const taxAmount = +(subtotal * (rate / 100)).toFixed(2);
  const total = +(subtotal + taxAmount).toFixed(2);
  return { subtotal: +subtotal.toFixed(2), taxAmount, total };
}

async function nextInvoiceNo() {
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const count = await Invoice.countDocuments({ invoiceNo: new RegExp(`^INV-${ym}-`) });
  return `INV-${ym}-${String(count + 1).padStart(3, '0')}`;
}

router.get('/invoices', async (_req, res) => {
  const invoices = await Invoice.find().populate('client', 'businessName whatsapp').sort({ createdAt: -1 }).limit(300);
  res.json({ success: true, data: invoices });
});

router.get('/invoices/:id', async (req, res) => {
  const inv = await Invoice.findById(req.params.id).populate('client');
  if (!inv) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: inv });
});

router.post('/invoices', async (req, res) => {
  try {
    const b = req.body || {};
    const items = Array.isArray(b.items) ? b.items : [];
    const { subtotal, taxAmount, total } = computeTotals(items, b.taxType, b.taxRate);
    const invoiceNo = b.invoiceNo?.trim() || (await nextInvoiceNo());

    let billTo = b.billTo || {};
    if (b.client) {
      const c = await Client.findById(b.client).lean().catch(() => null);
      if (c) billTo = { businessName: c.businessName, address: c.address, whatsapp: c.whatsapp, email: c.email };
    }

    const invoice = await Invoice.create({
      invoiceNo,
      docType: b.docType || 'INVOICE',
      client: b.client || undefined,
      billTo,
      date: b.date || '',
      dueDate: b.dueDate || '',
      terms: b.terms || 'Due on receipt',
      items,
      taxType: b.taxType || 'IGST',
      taxRate: Number(b.taxRate) || 0,
      subtotal, taxAmount, total,
      termsList: b.termsList || [],
      status: 'Draft'
    });
    res.status(201).json({ success: true, data: invoice });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Invoice number already exists' });
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/invoices/:id', async (req, res) => {
  const inv = await Invoice.findByIdAndDelete(req.params.id);
  if (!inv) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, message: 'Deleted' });
});

// Generate Razorpay dynamic UPI QR + payment link for an invoice.
router.post('/invoices/:id/razorpay', async (req, res) => {
  try {
    if (!razorpay.configured()) {
      return res.status(400).json({ success: false, message: 'Razorpay not configured on the server' });
    }
    const inv = await Invoice.findById(req.params.id).populate('client');
    if (!inv) return res.status(404).json({ success: false, message: 'Not found' });
    if (inv.total <= 0) return res.status(400).json({ success: false, message: 'Invoice total must be greater than 0' });

    const description = `${inv.docType} ${inv.invoiceNo}`;
    const customer = {
      name: inv.billTo?.businessName || inv.client?.businessName || '',
      email: inv.billTo?.email || inv.client?.email || '',
      contact: inv.billTo?.whatsapp || inv.client?.whatsapp || inv.client?.phone || ''
    };

    const results = {};
    // QR code (optional — some accounts don't have QR Codes enabled).
    try {
      const qr = await razorpay.createQrCode({ amount: inv.total, description, referenceId: inv.invoiceNo });
      inv.rzpQrId = qr.id;
      inv.rzpQrImageUrl = qr.image_url;
      results.qr = { id: qr.id, imageUrl: qr.image_url };
    } catch (e) {
      results.qrError = e.response?.data?.error?.description || e.message;
      logger.warn('razorpay QR create failed', { error: results.qrError });
    }
    // Payment link.
    try {
      const base = (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');
      const link = await razorpay.createPaymentLink({
        amount: inv.total, description, referenceId: inv.invoiceNo, customer,
        callbackUrl: base ? `${base}/api/razorpay/callback` : undefined
      });
      inv.rzpPaymentLinkId = link.id;
      inv.rzpPaymentLinkUrl = link.short_url;
      results.paymentLink = { id: link.id, url: link.short_url };
    } catch (e) {
      results.linkError = e.response?.data?.error?.description || e.message;
      logger.warn('razorpay payment link failed', { error: results.linkError });
    }

    if (inv.status === 'Draft') inv.status = 'Sent';
    await inv.save();
    res.json({ success: true, data: inv, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
