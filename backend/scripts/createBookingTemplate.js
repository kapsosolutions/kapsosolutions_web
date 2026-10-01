// Create the "demo booking confirmed" WhatsApp template — image header + body +
// a "Visit Website" URL button. This template lets us notify people who book a
// demo from the website (who may never have messaged us, so a normal message
// would be blocked by the 24h window). Run once:  npm run create-booking-template
//
// After Meta APPROVES it (check the Templates page), website-form bookings will
// automatically receive this confirmation on WhatsApp.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const metaCloud = (await import('../services/metaCloud.js')).default;

const TEMPLATE_NAME = 'demo_booking_confirmed';
const LANG = process.env.WA_BOOKING_TEMPLATE_LANG || 'en';
const WEBSITE = (process.env.WEBSITE_URL || 'https://www.kapsosolutions.com/').replace(/\/+$/, '/');
// Header sample used only for approval preview — the real image is set per-send.
const SAMPLE_IMAGE = 'https://www.kapsosolutions.com/logo.png';

const BODY_TEXT =
  'Your demo has been booked successfully! 🎉\n\n' +
  'Thank you for your interest in Kapso Solutions. Our team will reach out to you shortly to schedule your personalised demo.';

function upsertEnv(key, value) {
  let content = fs.readFileSync(envPath, 'utf8');
  const line = `${key}=${value}`;
  if (new RegExp(`^${key}=.*$`, 'm').test(content)) content = content.replace(new RegExp(`^${key}=.*$`, 'm'), line);
  else content += `\n${line}\n`;
  fs.writeFileSync(envPath, content);
}

async function run() {
  console.log('Uploading header sample image:', SAMPLE_IMAGE);
  const handle = await metaCloud.uploadHeaderSample({ fileUrl: SAMPLE_IMAGE, fileName: 'booking_header', fileType: 'image/png' });

  const payload = {
    name: TEMPLATE_NAME,
    language: LANG,
    category: 'MARKETING',
    components: [
      { type: 'HEADER', format: 'IMAGE', example: { header_handle: [handle] } },
      { type: 'BODY', text: BODY_TEXT },
      { type: 'FOOTER', text: 'Kapso Solutions' },
      { type: 'BUTTONS', buttons: [{ type: 'URL', text: 'Visit Website', url: WEBSITE }] }
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

  upsertEnv('WA_BOOKING_TEMPLATE', TEMPLATE_NAME);
  console.log(`\nWA_BOOKING_TEMPLATE=${TEMPLATE_NAME} written to .env`);
  console.log('Template status:', created.status || 'PENDING');
  console.log('It must be APPROVED by Meta before it will send. Check the admin Templates page.');
  process.exit(0);
}

run().catch((err) => {
  console.error('create-booking-template error:', err.response?.data || err.message);
  process.exit(1);
});
