// Shared "invoice paid" handling used by both the Razorpay webhook (real-time)
// and the admin "verify payment" endpoint (manual/polling fallback).
import razorpay from './razorpay.js';
import metaCloud from './metaCloud.js';
import { buildInvoicePdf } from './invoicePdf.js';
import logger from './logger.js';

export const money = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// On payment, send the client a WhatsApp receipt: a dynamically generated PDF
// (built in memory, uploaded to WhatsApp /media — NOT Cloudinary) plus, if
// configured, an approved template notification.
//
// A free-form document only reaches the user inside the 24h customer-care
// window. The template (WA_RECEIPT_TEMPLATE) guarantees delivery outside it; if
// its header is a document, we attach the same generated PDF to it.
export async function sendInvoiceReceipt(invoice) {
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

  // Send exactly ONE message. Prefer the approved template (delivers inside and
  // outside the 24h window and already carries the PDF as its document header).
  // Only fall back to a plain document if there's no template or it fails.
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

  // Fallback: send the PDF as a plain document (works within the 24h window)
  // only if the template wasn't sent.
  if (!sentSomething && mediaId) {
    try {
      const caption = `Payment received for ${invoice.invoiceNo}. Amount: ${money(invoice.total)}. Thank you!`;
      await metaCloud.sendDocumentMedia(phone, mediaId, fileName, caption);
      sentSomething = true;
    } catch (e) {
      logger.warn('receipt document send failed', { error: e.response?.data?.error?.message || e.message });
    }
  }

  if (sentSomething) {
    invoice.receiptSent = true;
    await invoice.save();
    logger.info('Invoice receipt sent', { invoiceNo: invoice.invoiceNo, phone, viaDocument: Boolean(mediaId) });
  }
}

// Mark an invoice as paid (idempotent), close its QR, and send the receipt.
export async function markInvoicePaid(invoice, paymentId) {
  if (!invoice || invoice.status === 'Paid') return invoice;
  invoice.status = 'Paid';
  invoice.paidAt = new Date();
  if (paymentId) invoice.rzpPaymentId = paymentId;
  await invoice.save();
  if (invoice.rzpQrId) razorpay.closeQrCode(invoice.rzpQrId).catch(() => {});
  if (!invoice.receiptSent) await sendInvoiceReceipt(invoice);
  return invoice;
}
