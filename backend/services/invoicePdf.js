// Build invoice / payment-receipt PDFs entirely in memory with pdfkit.
// The buffer is uploaded straight to WhatsApp's /media endpoint and discarded —
// it is NEVER written to disk and NEVER uploaded to Cloudinary.
import PDFDocument from 'pdfkit';
import axios from 'axios';
import logger from './logger.js';

const GREEN = '#00a84b';
const INK = '#1a1a1a';
const MUTED = '#666666';
const BLACK = '#0a0a0a';

async function fetchImage(url) {
  if (!url) return null;
  try {
    const r = await axios.get(url, { responseType: 'arraybuffer', timeout: 12000, maxContentLength: 5 * 1024 * 1024 });
    return Buffer.from(r.data);
  } catch (err) {
    logger.debug('[invoicePdf] logo fetch failed', { error: err.message });
    return null;
  }
}

function money(n) {
  return 'Rs. ' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Build the invoice / receipt PDF for an invoice document.
 * @param {object} invoice  — populated Invoice doc/obj
 * @param {object} [opts]
 * @param {string} [opts.logoUrl]  — logo image URL to embed in the header
 * @returns {Promise<Buffer>}
 */
export async function buildInvoicePdf(invoice, opts = {}) {
  const isPaid = invoice.status === 'Paid';
  const logoUrl = opts.logoUrl || process.env.RECEIPT_LOGO_URL || 'https://www.kapsosolutions.com/logo2.png';
  const logoBuf = await fetchImage(logoUrl);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageW = doc.page.width;
      const m = doc.page.margins.left;
      const cw = pageW - m * 2;

      // ── Header: logo (left) + company (right) ──
      if (logoBuf) {
        try { doc.image(logoBuf, m, 40, { fit: [120, 48] }); } catch { /* ignore bad image */ }
      }
      doc.font('Helvetica-Bold').fontSize(18).fillColor(INK)
        .text('KAPSO SOLUTIONS', m, 44, { width: cw, align: 'right' });
      doc.font('Helvetica').fontSize(8).fillColor(MUTED)
        .text('+91 7989909361  |  contact.kapsosolutions@gmail.com  |  kapsosolutions.com', m, 68, { width: cw, align: 'right' });

      // ── Title ──
      doc.moveTo(m, 100).lineTo(pageW - m, 100).lineWidth(2).strokeColor(GREEN).stroke();
      doc.font('Helvetica-Bold').fontSize(22).fillColor(GREEN)
        .text(isPaid ? 'PAYMENT RECEIPT' : (invoice.docType || 'INVOICE'), m, 110, { width: cw, align: 'right' });

      // ── Bill-to + meta ──
      let y = 150;
      doc.font('Helvetica-Bold').fontSize(9).fillColor(GREEN)
        .text(isPaid ? 'RECEIVED FROM:' : `${invoice.docType || 'INVOICE'} TO:`, m, y);
      doc.font('Helvetica-Bold').fontSize(13).fillColor(INK)
        .text(invoice.billTo?.businessName || '—', m, y + 14);
      let by = y + 32;
      if (invoice.billTo?.address) { doc.font('Helvetica').fontSize(10).fillColor(MUTED).text(invoice.billTo.address, m, by, { width: cw / 2 }); by += 14; }
      if (invoice.billTo?.whatsapp) { doc.font('Helvetica').fontSize(10).fillColor(MUTED).text('+' + invoice.billTo.whatsapp, m, by); }

      const metaX = m + cw * 0.58;
      const metaW = cw * 0.42;
      const metaRow = (label, val, ry) => {
        doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(label, metaX, ry, { width: metaW * 0.45 });
        doc.font('Helvetica-Bold').fontSize(9).fillColor(INK).text(val || '—', metaX + metaW * 0.45, ry, { width: metaW * 0.55, align: 'right' });
      };
      let my = y;
      metaRow('Invoice No:', invoice.invoiceNo, my); my += 15;
      metaRow('Date:', invoice.date, my); my += 15;
      metaRow('Terms:', invoice.terms, my); my += 15;
      metaRow('Due Date:', invoice.dueDate, my); my += 15;
      if (invoice.rzpPaymentId) { metaRow('Payment ID:', invoice.rzpPaymentId, my); my += 15; }

      // ── Items table ──
      y = Math.max(by, my) + 24;
      const cNo = m + 6, cDesc = m + 40, cHsn = m + cw * 0.62, cAmt = m + cw;
      doc.rect(m, y, cw, 24).fill(BLACK);
      doc.fillColor('#fff').font('Helvetica-Bold').fontSize(9);
      doc.text('#', cNo, y + 8);
      doc.text('DESCRIPTION', cDesc, y + 8);
      doc.text('HSN', cHsn, y + 8);
      doc.text('AMOUNT', m, y + 8, { width: cw - 10, align: 'right' });
      y += 24;

      (invoice.items || []).forEach((it, i) => {
        const rowH = it.details ? 34 : 24;
        doc.fillColor(INK).font('Helvetica-Bold').fontSize(10);
        doc.text(String(i + 1), cNo, y + 7);
        doc.text(it.title || '', cDesc, y + 7, { width: cHsn - cDesc - 10 });
        if (it.details) doc.font('Helvetica').fontSize(8).fillColor(MUTED).text(it.details, cDesc, y + 20, { width: cHsn - cDesc - 10 });
        doc.font('Helvetica').fontSize(9).fillColor(INK).text(it.hsn || '', cHsn, y + 7);
        doc.font('Helvetica').fontSize(10).fillColor(INK).text(money(it.amount), m, y + 7, { width: cw - 10, align: 'right' });
        y += rowH;
        doc.moveTo(m, y).lineTo(pageW - m, y).lineWidth(0.5).strokeColor('#e5e5e5').stroke();
      });

      // ── Totals (right) ──
      y += 16;
      const totX = m + cw * 0.55;
      const totW = cw * 0.45;
      const totRow = (label, val, bold) => {
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 13 : 10).fillColor(INK);
        doc.text(label, totX, y, { width: totW * 0.5 });
        doc.text(val, totX, y, { width: totW, align: 'right' });
        y += bold ? 24 : 18;
      };
      totRow('Subtotal', money(invoice.subtotal));
      if (invoice.taxType && invoice.taxType !== 'NONE') totRow(`${invoice.taxType} ${invoice.taxRate}%`, money(invoice.taxAmount));
      doc.moveTo(totX, y + 2).lineTo(pageW - m, y + 2).lineWidth(1.5).strokeColor(BLACK).stroke();
      y += 8;
      totRow('Total', money(invoice.total), true);

      // ── PAID stamp ──
      if (isPaid) {
        doc.save();
        doc.rotate(-14, { origin: [m + 120, y + 10] });
        doc.font('Helvetica-Bold').fontSize(46).fillColor(GREEN).opacity(0.18)
          .text('PAID', m + 20, y - 10);
        doc.restore();
        doc.opacity(1);
      }

      // ── Terms ──
      if (Array.isArray(invoice.termsList) && invoice.termsList.length) {
        y += 20;
        doc.font('Helvetica-Bold').fontSize(10).fillColor(INK).text('Terms & Conditions:', m, y);
        y += 15;
        invoice.termsList.forEach((t) => {
          doc.font('Helvetica').fontSize(8.5).fillColor(MUTED).text('•  ' + t, m, y, { width: cw });
          y += 13;
        });
      }

      // ── Footer ──
      doc.font('Helvetica').fontSize(8.5).fillColor('#999')
        .text(`This is a computer generated ${isPaid ? 'receipt' : 'invoice'}. No signature required.`,
          m, doc.page.height - 55, { width: cw, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export default { buildInvoicePdf };
