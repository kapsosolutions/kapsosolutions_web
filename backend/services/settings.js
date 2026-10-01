// Admin-managed flow settings (message copy + header images) with sane defaults.
import FlowSetting from '../models/FlowSetting.js';

export const SETTING_KEYS = {
  WELCOME_IMAGE: 'welcome_header_image',
  WELCOME_BODY: 'welcome_body',
  BOOK_DEMO_CTA: 'book_demo_cta',
  SUCCESS_IMAGE: 'demo_success_image',
  SUCCESS_BODY: 'demo_success_body',
  ALREADY_IMAGE: 'already_booked_image',
  ALREADY_BODY: 'already_booked_body'
};

export const DEFAULTS = {
  [SETTING_KEYS.WELCOME_IMAGE]: { type: 'image', label: 'Welcome message header image', value: '' },
  [SETTING_KEYS.WELCOME_BODY]: {
    type: 'text', label: 'Welcome message body',
    value: 'Welcome to Kapso Solutions! 👋\n\nWe help businesses automate customer conversations on WhatsApp. Tap *Book Demo* below and our team will set up a personalised demo for you.'
  },
  [SETTING_KEYS.BOOK_DEMO_CTA]: { type: 'text', label: 'Book Demo button text', value: 'Book Demo' },
  [SETTING_KEYS.SUCCESS_IMAGE]: { type: 'image', label: 'Demo booked success image', value: '' },
  [SETTING_KEYS.SUCCESS_BODY]: {
    type: 'text', label: 'Demo booked success body',
    value: '✅ Your demo has been booked successfully!\n\nThank you for your interest in Kapso Solutions. Our team will reach out to you shortly to schedule your personalised demo.'
  },
  [SETTING_KEYS.ALREADY_IMAGE]: { type: 'image', label: 'Already-requested image', value: '' },
  [SETTING_KEYS.ALREADY_BODY]: {
    type: 'text', label: 'Already-requested body',
    value: 'You have already requested a demo with us. 🙌\n\nOur team will contact you shortly. Meanwhile, feel free to explore our website.'
  }
};

// Ensure all default settings exist in the DB (called at boot).
export async function seedSettings() {
  for (const [key, def] of Object.entries(DEFAULTS)) {
    await FlowSetting.updateOne(
      { key },
      { $setOnInsert: { key, label: def.label, type: def.type, value: def.value } },
      { upsert: true }
    );
  }
}

// Get a single setting value (falls back to default).
export async function getSetting(key) {
  const doc = await FlowSetting.findOne({ key }).lean();
  if (doc && (doc.value || doc.value === '')) return doc.value;
  return DEFAULTS[key]?.value || '';
}

// Get many settings as a { key: value } map.
export async function getSettings(keys) {
  const docs = await FlowSetting.find({ key: { $in: keys } }).lean();
  const map = {};
  keys.forEach((k) => (map[k] = DEFAULTS[k]?.value || ''));
  docs.forEach((d) => (map[d.key] = d.value || DEFAULTS[d.key]?.value || ''));
  return map;
}

export default { SETTING_KEYS, DEFAULTS, seedSettings, getSetting, getSettings };
