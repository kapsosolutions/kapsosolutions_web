// Conversation logic for the Kapso "Book Demo" WhatsApp bot.
import metaCloud from './metaCloud.js';
import cloudinaryService from './cloudinary.js';
import logger from './logger.js';
import Message from '../models/Message.js';
import DemoLead from '../models/DemoLead.js';
import { emitMessage, emitStatus, emitDemo, emitReaction } from './eventBus.js';
import { touchInbound, touchOutbound, getConversation } from './conversationState.js';
import { getSettings, SETTING_KEYS } from './settings.js';

const WEBSITE_URL = () => process.env.WEBSITE_URL || 'https://www.kapsosolutions.com/';

// Log an inbound message to the CRM chat log. For media messages we download
// the bytes from Meta, host them on Cloudinary, and store the URL so the CRM
// can render the image/video/audio/document.
export async function logInbound(phone, name, type, body, raw, metaMessageId, media) {
  try {
    let mediaInfo = null;
    if (media?.id) {
      try {
        const { buffer, mime } = await metaCloud.downloadMedia(media.id);
        const resourceType = mime.startsWith('image/') ? 'image' : mime.startsWith('video/') || mime.startsWith('audio/') ? 'video' : 'raw';
        const url = await cloudinaryService.uploadBuffer(buffer, 'kapso/inbound', resourceType);
        mediaInfo = { url, type, mime, filename: media.filename || '', caption: media.caption || '' };
      } catch (e) {
        logger.warn('inbound media download failed', { error: e.response?.data?.error?.message || e.message });
      }
    }
    const doc = await Message.create({
      phone, name, direction: 'in', type,
      // For media without a caption, keep the body empty (no "📷 Photo" placeholder).
      body: media ? (media.caption || '') : (body || ''),
      raw: mediaInfo ? { meta: raw, media: mediaInfo } : raw,
      metaMessageId, status: 'received'
    });
    emitMessage(doc);
    await touchInbound(phone, name, body);
  } catch (err) {
    logger.warn('logInbound failed', { error: err.message });
  }
}

// Inbound emoji reaction on a message -> store it + notify the CRM.
export async function handleReaction(reaction) {
  try {
    const messageId = reaction?.message_id;
    if (!messageId) return;
    const emoji = reaction.emoji || '';
    await Message.updateOne({ metaMessageId: messageId }, { $set: { reaction: emoji } });
    emitReaction({ metaMessageId: messageId, emoji });
  } catch (err) {
    logger.debug('handleReaction error', { error: err.message });
  }
}

// Delivery/read receipts -> update the stored message + notify the CRM (ticks).
export async function handleStatus(status) {
  try {
    const { id, status: st } = status;
    if (!id || !st) return;
    await Message.updateOne({ metaMessageId: id }, { $set: { status: st } });
    emitStatus({ metaMessageId: id, status: st });
  } catch (err) {
    logger.debug('handleStatus error', { error: err.message });
  }
}

// Send the welcome message: image header + body + "Book Demo" flow button.
async function sendWelcome(phone) {
  const s = await getSettings([SETTING_KEYS.WELCOME_IMAGE, SETTING_KEYS.WELCOME_BODY, SETTING_KEYS.BOOK_DEMO_CTA]);
  const flowId = process.env.WA_FLOW_BOOK_DEMO_ID;
  const cta = s[SETTING_KEYS.BOOK_DEMO_CTA] || 'Book Demo';
  const body = s[SETTING_KEYS.WELCOME_BODY];
  const headerImage = s[SETTING_KEYS.WELCOME_IMAGE];

  if (!flowId) {
    // Flow not published yet — fall back to a reply button so the bot still responds.
    logger.warn('WA_FLOW_BOOK_DEMO_ID not set; sending fallback welcome');
    if (headerImage) return metaCloud.sendImageWithButtons(phone, headerImage, body, [{ id: 'book_demo', text: cta }]);
    return metaCloud.sendButtons(phone, body, [{ id: 'book_demo', text: cta }]);
  }

  const flowToken = `book_demo_${phone}`;
  return metaCloud.sendFlowMessage(phone, {
    flowId,
    flowCta: cta,
    headerImageUrl: headerImage || undefined,
    headerText: headerImage ? undefined : 'Kapso Solutions',
    bodyText: body,
    flowToken,
    flowAction: 'data_exchange',
    mode: process.env.NODE_ENV === 'production' ? 'published' : 'published'
  });
}

// Send the "already requested a demo" notice with a Visit Website CTA.
async function sendAlreadyBooked(phone) {
  const s = await getSettings([SETTING_KEYS.ALREADY_IMAGE, SETTING_KEYS.ALREADY_BODY]);
  const body = s[SETTING_KEYS.ALREADY_BODY];
  const image = s[SETTING_KEYS.ALREADY_IMAGE];
  await touchOutbound(phone, body);
  return metaCloud.sendCtaUrl(phone, body, 'Visit Website', WEBSITE_URL(), 'Kapso Solutions', image || null);
}

// Send the "demo booked successfully" message with a Visit Website CTA.
// Used for WhatsApp-flow bookings (the 24h session is open).
export async function sendDemoSuccess(phone) {
  const s = await getSettings([SETTING_KEYS.SUCCESS_IMAGE, SETTING_KEYS.SUCCESS_BODY]);
  const body = s[SETTING_KEYS.SUCCESS_BODY];
  const image = s[SETTING_KEYS.SUCCESS_IMAGE];
  await touchOutbound(phone, body);
  return metaCloud.sendCtaUrl(phone, body, 'Visit Website', WEBSITE_URL(), 'Kapso Solutions', image || null);
}

// Send the booking confirmation. Prefers an approved template (image header +
// Visit Website button) so it delivers even to people who booked via the
// website and never messaged us (outside the 24h session). Falls back to the
// rich interactive message when no template is configured/approved.
export async function sendBookingConfirmation(phone) {
  const template = process.env.WA_BOOKING_TEMPLATE;
  const s = await getSettings([SETTING_KEYS.SUCCESS_IMAGE]);
  // The booking template has an IMAGE header, which needs a link at send time.
  const image = s[SETTING_KEYS.SUCCESS_IMAGE] || 'https://www.kapsosolutions.com/logo.png';
  if (template) {
    try {
      await metaCloud.sendTemplate(phone, template, {
        languageCode: process.env.WA_BOOKING_TEMPLATE_LANG || 'en_US',
        headerImageUrl: image
      });
      await touchOutbound(phone, 'Demo booking confirmed');
      return { sent: true, via: 'template' };
    } catch (e) {
      logger.warn('booking template send failed, falling back to session message', {
        error: e.response?.data?.error?.message || e.message
      });
    }
  }
  try {
    await sendDemoSuccess(phone);
    return { sent: true, via: 'session' };
  } catch (e) {
    logger.warn('booking confirmation could not be sent', { error: e.response?.data?.error?.message || e.message });
    return { sent: false };
  }
}

// Send the "you already requested a demo" confirmation. Prefers the approved
// template (works even outside the 24h window, e.g. a website re-booking),
// falling back to the rich interactive message when no template is set.
export async function sendAlreadyRequestedConfirmation(phone) {
  const template = process.env.WA_ALREADY_TEMPLATE;
  const s = await getSettings([SETTING_KEYS.ALREADY_IMAGE]);
  const image = s[SETTING_KEYS.ALREADY_IMAGE] || 'https://www.kapsosolutions.com/logo.png';
  if (template) {
    try {
      await metaCloud.sendTemplate(phone, template, {
        languageCode: process.env.WA_ALREADY_TEMPLATE_LANG || 'en_US',
        headerImageUrl: image
      });
      await touchOutbound(phone, 'Already requested confirmation');
      return { sent: true, via: 'template' };
    } catch (e) {
      logger.warn('already-requested template send failed, falling back', {
        error: e.response?.data?.error?.message || e.message
      });
    }
  }
  try {
    await sendAlreadyBooked(phone);
    return { sent: true, via: 'session' };
  } catch (e) {
    logger.warn('already-requested confirmation could not be sent', { error: e.response?.data?.error?.message || e.message });
    return { sent: false };
  }
}

// Main inbound handler.
export async function handleMessage(msg) {
  const { phone, type } = msg;

  // If an agent paused automation for this chat, don't auto-reply at all —
  // the inbound message is still logged for the CRM.
  const convo = await getConversation(phone);
  if (convo?.botPaused) {
    logger.debug('automation paused, skipping auto-reply', { phone });
    return;
  }

  // Flow completion arrives as a flow (nfm_reply) message. The lead is persisted
  // by the flow endpoint; here we just confirm with the success message.
  if (type === 'flow') {
    logger.info('Flow response received', { phone });
    return sendDemoSuccess(phone);
  }

  // Media messages are logged for the agent in the CRM — no auto-reply on those.
  if (['image', 'video', 'audio', 'document'].includes(type)) return;

  // Any other inbound (text / button / etc.): welcome or already-booked notice.
  const existing = await DemoLead.findOne({ phone }).lean();
  if (existing) {
    return sendAlreadyBooked(phone);
  }
  return sendWelcome(phone);
}

export default { handleMessage, handleStatus, handleReaction, logInbound, sendDemoSuccess, sendBookingConfirmation, sendAlreadyRequestedConfirmation };
