import express from 'express';
import { decryptRequest, encryptResponse } from '../services/flowCrypto.js';
import Category from '../models/Category.js';
import DemoLead from '../models/DemoLead.js';
import { urlToBase64 } from '../services/imageBase64.js';
import { emitDemo } from '../services/eventBus.js';
import logger from '../services/logger.js';

const router = express.Router();

// Flow token: book_demo_<phone>. Grab the trailing digit run for the phone.
function phoneFromToken(token = '') {
  const m = String(token).match(/(\d{6,})$/);
  return m ? m[1] : '';
}

// Fallback categories when the admin hasn't configured any yet, so the required
// dropdown always has options and the flow can render.
const DEFAULT_CATEGORIES = [
  { id: 'retail', title: 'Retail / Shop' },
  { id: 'restaurant', title: 'Restaurant / Food' },
  { id: 'healthcare', title: 'Healthcare / Clinic' },
  { id: 'education', title: 'Education' },
  { id: 'real_estate', title: 'Real Estate' },
  { id: 'services', title: 'Services' },
  { id: 'other', title: 'Other' }
];

// Build the category dropdown with 1:1 base64 logos (Meta Flow requires raw base64).
async function categoryOptions() {
  const cats = await Category.find({ active: true }).sort({ order: 1, createdAt: 1 }).lean();
  if (!cats.length) return DEFAULT_CATEGORIES;
  return Promise.all(
    cats.map(async (c) => {
      const item = { id: c.slug || String(c._id), title: c.name };
      if (c.imageUrl) {
        try {
          const b64 = await urlToBase64(c.imageUrl, { width: 180, height: 180, crop: 'fill', quality: 80, format: 'jpg' });
          if (b64) item.image = b64;
        } catch { /* ignore */ }
      }
      return item;
    })
  );
}

router.post('/', async (req, res) => {
  let aesKeyBuffer, initialVectorBuffer, decrypted;
  try {
    ({ decrypted, aesKeyBuffer, initialVectorBuffer } = decryptRequest(req.body));
  } catch (err) {
    logger.error('Flow endpoint decrypt failed', { error: err.message });
    return res.status(421).send(); // tells Meta to refresh the public key
  }

  try {
    const { action, screen, data = {}, flow_token, version } = decrypted;
    const token = flow_token || data.flow_token || '';
    logger.info('Flow endpoint request', { action, screen, version, hasToken: !!token });

    if (action === 'ping') {
      return sendEncrypted(res, { version, data: { status: 'active' } }, aesKeyBuffer, initialVectorBuffer);
    }

    if (action === 'INIT') {
      const phone = phoneFromToken(token);
      const cats = await categoryOptions();
      return sendEncrypted(
        res,
        {
          version,
          screen: 'BOOK_DEMO',
          data: {
            categories: cats,
            wa_number: phone ? `+${phone}` : '',
            heading: 'Book your free demo',
            subheading: 'Tell us a little about your business and our team will reach out.'
          }
        },
        aesKeyBuffer,
        initialVectorBuffer
      );
    }

    if (action === 'data_exchange') {
      const response = await handleDataExchange(screen, data, token);
      return sendEncrypted(res, { version, ...response }, aesKeyBuffer, initialVectorBuffer);
    }

    return sendEncrypted(res, { version, data: {} }, aesKeyBuffer, initialVectorBuffer);
  } catch (err) {
    logger.error('Flow endpoint processing error', { error: err.message, stack: err.stack });
    return sendEncrypted(
      res,
      { version: decrypted?.version, screen: 'BOOK_DEMO', data: { error_message: 'Something went wrong. Please try again.' } },
      aesKeyBuffer,
      initialVectorBuffer
    );
  }
});

async function handleDataExchange(screen, data, token) {
  if (screen === 'BOOK_DEMO') {
    const phone = phoneFromToken(token);
    let categoryName = data.category || '';
    if (data.category) {
      const cat = await Category.findOne({ slug: data.category }).lean().catch(() => null);
      if (cat) categoryName = cat.name;
    }

    try {
      const lead = await DemoLead.findOneAndUpdate(
        { phone },
        {
          $set: {
            phone,
            name: (data.name || '').trim(),
            businessName: (data.business_name || '').trim(),
            businessAddress: (data.business_address || '').trim(),
            category: categoryName,
            categorySlug: data.category || '',
            altMobile: (data.alt_mobile || '').trim(),
            email: (data.email || '').trim(),
            source: 'whatsapp',
            status: 'New'
          }
        },
        { upsert: true, new: true }
      );
      emitDemo(lead);
      logger.info('Demo lead saved', { phone, business: lead.businessName });
    } catch (err) {
      logger.error('Demo lead save failed', { error: err.message });
    }

    // Terminal screen — completes the flow and returns an nfm_reply to the webhook.
    return {
      screen: 'SUCCESS',
      data: { extension_message_response: { params: { flow_token: token, booked: true } } }
    };
  }

  return { data: {} };
}

function sendEncrypted(res, obj, aesKeyBuffer, initialVectorBuffer) {
  const encrypted = encryptResponse(obj, aesKeyBuffer, initialVectorBuffer);
  res.type('text/plain').send(encrypted);
}

export default router;
