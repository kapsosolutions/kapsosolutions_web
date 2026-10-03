// Create the "payment receipt" WhatsApp template — a DOCUMENT header (the
// dynamically generated invoice PDF is attached per-send) + a body with the
// customer name, invoice number and amount as variables. This UTILITY template
// lets us deliver the receipt even when the payer is outside the 24h window
// (e.g. they just scanned the QR and never chatted with us).
//
// Run once:  npm run create-receipt-template
// After Meta APPROVES it, set these in the backend env (the script writes them
// to .env automatically for local use):
//   WA_RECEIPT_TEMPLATE=payment_receipt
//   WA_RECEIPT_TEMPLATE_LANG=en
//   WA_RECEIPT_TEMPLATE_HEADER=document
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const metaCloud = (await import('../services/metaCloud.js')).default;
const { buildInvoicePdf } = await import('../services/invoicePdf.js');

const TEMPLATE_NAME = process.env.WA_RECEIPT_TEMPLATE || 'payment_receipt';
const LANG = process.env.WA_RECEIPT_TEMPLATE_LANG || 'en';

// Simple, clear receipt body. {{1}} name, {{2}} invoice no, {{3}} amount.
const BODY_TEXT =
  'Hi {{1}}, we have received your payment. ✅\n\n' +
  'Invoice No: {{2}}\n' +
  'Amount Paid: {{3}}\n\n' +
  'Your receipt is attached above. Thank you for choosing Kapso Solutions!';

// Example values shown to Meta reviewers during approval.
const BODY_EXAMPLE = ['Kapso Solutions', 'INV-202610-001', 'Rs. 3,498.00'];

function upsertEnv(key, value) {
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const line = `${key}=${value}`;
  if (new RegExp(`^${key}=.*$`, 'm').test(content)) content = content.replace(new RegExp(`^${key}=.*$`, 'm'), line);
  else content += (content.endsWith('\n') || content === '' ? '' : '\n') + `${line}\n`;
  fs.writeFileSync(envPath, content);
}

async function run() {
  // 1) Build a sample PDF (in memory) to use as the header example for approval.
  console.log('Building sample receipt PDF for the header example...');
  const samplePdf = await buildInvoicePdf({
    status: 'Paid', docType: 'INVOICE', invoiceNo: 'INV-202610-001',
    date: '03 Oct 2026', dueDate: '03 Oct 2026', terms: 'Due on receipt', rzpPaymentId: 'pay_sample',
    billTo: { businessName: 'Kapso Solutions', address: 'Nellore, Andhra Pradesh', whatsapp: '919999999999' },
    items: [
      { title: 'One time Onboarding & Setup Fees', details: 'Setup Cost', hsn: '998311', amount: 2999 },
      { title: 'First Month Charges', details: 'Monthly Charges', hsn: '999599', amount: 499 }
    ],
    taxType: 'NONE', taxRate: 0, subtotal: 3498, taxAmount: 0, total: 3498,
    termsList: ['Subject to jurisdiction.', 'All payments payable to Kapso Solutions.']
  });

  console.log('Uploading sample PDF to get a header handle...');
  const handle = await metaCloud.uploadHeaderSampleBuffer(samplePdf, { fileName: 'receipt_sample.pdf', fileType: 'application/pdf' });

  const payload = {
    name: TEMPLATE_NAME,
    language: LANG,
    category: 'UTILITY',
    components: [
      { type: 'HEADER', format: 'DOCUMENT', example: { header_handle: [handle] } },
      { type: 'BODY', text: BODY_TEXT, example: { body_text: [BODY_EXAMPLE] } },
      { type: 'FOOTER', text: 'Kapso Solutions' }
    ]
  };

  console.log('Creating template on Meta...');
  const created = await metaCloud.createTemplate(payload).catch((e) => {
    const msg = e.response?.data?.error;
    if (msg?.error_user_title?.includes('already') || String(msg?.message).includes('already exists')) {
      console.log('Template already exists — reusing name.');
      return { status: 'EXISTS' };
    }
    throw e;
  });

  upsertEnv('WA_RECEIPT_TEMPLATE', TEMPLATE_NAME);
  upsertEnv('WA_RECEIPT_TEMPLATE_LANG', LANG);
  upsertEnv('WA_RECEIPT_TEMPLATE_HEADER', 'document');

  console.log(`\nWritten to .env:`);
  console.log(`  WA_RECEIPT_TEMPLATE=${TEMPLATE_NAME}`);
  console.log(`  WA_RECEIPT_TEMPLATE_LANG=${LANG}`);
  console.log(`  WA_RECEIPT_TEMPLATE_HEADER=document`);
  console.log('\nTemplate status:', created.status || 'PENDING');
  console.log('It must be APPROVED by Meta before it will send. Check the admin Templates page.');
  console.log('Remember to set the same WA_RECEIPT_* vars on Render.');
  process.exit(0);
}

run().catch((err) => {
  console.error('create-receipt-template error:', err.response?.data || err.message);
  process.exit(1);
});
