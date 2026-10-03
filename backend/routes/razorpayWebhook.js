import express from 'express';
import Invoice from '../models/Invoice.js';
import razorpay from '../services/razorpay.js';
import metaCloud from '../services/metaCloud.js';
import logger from '../services/logger.js';

const router = express.Router();

// Format rupees for display in the receipt.
const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Send the "payment received" receipt to the client's WhatsApp via an approved
// template. Expected template body variables: {{1}} business name, {{2}} invoice
// no, {{3}} amount. Header is an image (Kapso logo). Configure WA_RECEIPT_TEMPLATE.
async function sendInvoiceReceipt(invoice) {
  try {
    const template = process.env.WA_RECEIPT_TEMPLATE;
    const phone = invoice.billTo?.whatsapp;
    if (!template || !phone) return;
    const logo = process.env.RECEIPT_LOGO_URL || 'https://www.kapsosolutions.com/logo.png';
    await metaCloud.sendTemplate(phone, template, {
      languageCode: process.env.WA_RECEIPT_TEMPLATE_LANG || 'en_US',
      headerImageUrl: logo,
      bodyParams: [invoice.billTo?.businessName || 'Customer', invoice.invoiceNo, money(invoice.total)]
    });
    invoice.receiptSent = true;
    await invoice.save();
    logger.info('Invoice receipt sent', { invoiceNo: invoice.invoiceNo, phone });
  } catch (e) {
    logger.warn('sendInvoiceReceipt failed', { error: e.response?.data?.error?.message || e.message });
  }
}

async function markPaid(invoice, paymentId) {
  if (!invoice || invoice.status === 'Paid') return;
  invoice.status = 'Paid';
  invoice.paidAt = new Date();
  if (paymentId) invoice.rzpPaymentId = paymentId;
  await invoice.save();
  // Close the QR so it can't be paid again.
  if (invoice.rzpQrId) razorpay.closeQrCode(invoice.rzpQrId).catch(() => {});
  if (!invoice.receiptSent) await sendInvoiceReceipt(invoice);
}

// ---------- Webhook (POST) ----------
router.post('/webhook', async (req, res) => {
  const signature = req.get('x-razorpay-signature');
  if (!razorpay.verifyWebhookSignature(req.rawBody, signature)) {
    logger.warn('Razorpay webhook signature mismatch');
    return res.sendStatus(401);
  }
  res.sendStatus(200); // ack immediately

  try {
    const event = req.body?.event;
    const payload = req.body?.payload || {};
    logger.info('Razorpay webhook', { event });

    if (event === 'qr_code.credited') {
      const qrId = payload.qr_code?.entity?.id;
      const paymentId = payload.payment?.entity?.id;
      const inv = await Invoice.findOne({ rzpQrId: qrId });
      await markPaid(inv, paymentId);
    } else if (event === 'payment_link.paid') {
      const linkId = payload.payment_link?.entity?.id;
      const paymentId = payload.payment?.entity?.id;
      const inv = await Invoice.findOne({ rzpPaymentLinkId: linkId });
      await markPaid(inv, paymentId);
    } else if (event === 'payment.captured') {
      const entity = payload.payment?.entity || {};
      const ref = entity.notes?.reference_id;
      if (ref) {
        const inv = await Invoice.findOne({ invoiceNo: ref });
        await markPaid(inv, entity.id);
      }
    }
  } catch (err) {
    logger.error('Razorpay webhook processing error', { error: err.message });
  }
});

// ---------- Payment-link callback (GET) ----------
router.get('/callback', (req, res) => {
  const paymentId = req.query.razorpay_payment_id;
  const website = process.env.WEBSITE_URL || 'https://www.kapsosolutions.com/';
  res.type('html').send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Payment ${paymentId ? 'Received' : 'Status'}</title>
<style>body{font-family:'Outfit',system-ui,sans-serif;background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}.c{text-align:center;max-width:420px;padding:40px}.i{width:80px;height:80px;border-radius:50%;background:#25d366;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:42px}.b{display:inline-block;margin-top:24px;background:#25d366;color:#06210f;padding:12px 28px;border-radius:50px;text-decoration:none;font-weight:600}</style></head>
<body><div class="c"><div class="i">✓</div><h1>${paymentId ? 'Payment Received' : 'Thank you'}</h1>
<p style="color:#9ca3af">${paymentId ? 'Your payment was successful. A receipt will be sent to your WhatsApp shortly.' : 'Your payment is being processed.'}</p>
<a class="b" href="${website}">Visit Website</a></div></body></html>`);
});

export default router;
