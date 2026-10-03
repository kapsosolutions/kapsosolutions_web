import express from 'express';
import Invoice from '../models/Invoice.js';
import razorpay from '../services/razorpay.js';
import metaCloud from '../services/metaCloud.js';
import { buildInvoicePdf } from '../services/invoicePdf.js';
import logger from '../services/logger.js';

const router = express.Router();

// Format rupees for display in the receipt.
const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// On payment, send the client a WhatsApp receipt: a dynamically generated PDF
// (built in memory, uploaded to WhatsApp /media — NOT Cloudinary) plus, if
// configured, an approved template notification.
//
// Note on delivery: a free-form document only reaches the user inside the 24h
// customer-care window (i.e. if they recently chatted with the bot). The
// template (WA_RECEIPT_TEMPLATE) is what guarantees delivery outside that window;
// if its header is a document, we attach the same generated PDF to it.
async function sendInvoiceReceipt(invoice) {
  const phone = invoice.billTo?.whatsapp;
  if (!phone) return;
  let sentSomething = false;

  // 1) Generate the receipt PDF in memory and upload it to WhatsApp media.
  let mediaId = null;
  const fileName = `Receipt-${invoice.invoiceNo || 'invoice'}.pdf`;
  try {
    const pdf = await buildInvoicePdf(invoice);
    mediaId = await metaCloud.uploadMedia(pdf, { mimeType: 'application/pdf', filename: fileName });
  } catch (e) {
    logger.warn('receipt PDF build/upload failed', { error: e.response?.data?.error?.message || e.message });
  }

  // 2) Try to send the PDF as a document (works within the 24h window).
  if (mediaId) {
    try {
      const caption = `Payment received for ${invoice.invoiceNo}. Amount: ${money(invoice.total)}. Thank you!`;
      await metaCloud.sendDocumentMedia(phone, mediaId, fileName, caption);
      sentSomething = true;
    } catch (e) {
      logger.warn('receipt document send failed', { error: e.response?.data?.error?.message || e.message });
    }
  }

  // 3) Approved template notification (guaranteed outside the 24h window).
  const template = process.env.WA_RECEIPT_TEMPLATE;
  if (template) {
    try {
      const headerIsDoc = String(process.env.WA_RECEIPT_TEMPLATE_HEADER || '').toLowerCase() === 'document';
      await metaCloud.sendTemplate(phone, template, {
        languageCode: process.env.WA_RECEIPT_TEMPLATE_LANG || 'en_US',
        headerImageUrl: headerIsDoc ? null : (process.env.RECEIPT_LOGO_URL || 'https://www.kapsosolutions.com/logo2.png'),
        headerDocumentMediaId: headerIsDoc ? mediaId : null,
        headerDocumentFilename: fileName,
        bodyParams: [invoice.billTo?.businessName || 'Customer', invoice.invoiceNo, money(invoice.total)]
      });
      sentSomething = true;
    } catch (e) {
      logger.warn('receipt template send failed', { error: e.response?.data?.error?.message || e.message });
    }
  }

  if (sentSomething) {
    invoice.receiptSent = true;
    await invoice.save();
    logger.info('Invoice receipt sent', { invoiceNo: invoice.invoiceNo, phone, viaDocument: Boolean(mediaId) });
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
