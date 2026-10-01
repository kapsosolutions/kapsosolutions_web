import express from 'express';
import crypto from 'crypto';
import logger from '../services/logger.js';
import { handleMessage, handleStatus, handleReaction, logInbound } from '../services/chatbot.js';

const router = express.Router();

// ---------- GET: webhook verification handshake ----------
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  const verifyToken = process.env.WA_VERIFY_TOKEN;

  if (!verifyToken) {
    logger.error('WA_VERIFY_TOKEN not configured');
    return res.sendStatus(500);
  }
  if (mode === 'subscribe' && token === verifyToken) {
    logger.info('WhatsApp webhook verified');
    return res.status(200).send(challenge);
  }
  if (!mode && !token) {
    return res.json({ status: 'Kapso WhatsApp webhook active', timestamp: new Date().toISOString() });
  }
  logger.warn('Webhook verification failed', { mode, tokenMatch: token === verifyToken });
  return res.sendStatus(403);
});

// ---------- POST: incoming messages / statuses ----------
router.post('/', async (req, res) => {
  // Optional signature check (uses raw body captured in server.js)
  if (process.env.WA_APP_SECRET && req.rawBody) {
    const signature = req.get('x-hub-signature-256') || '';
    const expected = 'sha256=' + crypto.createHmac('sha256', process.env.WA_APP_SECRET).update(req.rawBody).digest('hex');
    if (signature && !timingSafeEqual(signature, expected)) {
      logger.warn('Webhook signature mismatch');
      return res.sendStatus(401);
    }
  }

  res.sendStatus(200); // ack immediately

  try {
    const body = req.body;
    if (body.object !== 'whatsapp_business_account') return;

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== 'messages') continue;
        const value = change.value || {};

        if (value.statuses?.length) {
          for (const status of value.statuses) {
            handleStatus(status).catch((e) => logger.error('handleStatus error', { error: e.message }));
          }
        }

        const names = {};
        for (const c of value.contacts || []) {
          if (c.wa_id && c.profile?.name) names[c.wa_id] = c.profile.name;
        }

        for (const message of value.messages || []) {
          // Emoji reactions arrive as their own message type — handle + skip.
          if (message.type === 'reaction') {
            handleReaction(message.reaction).catch((e) => logger.error('handleReaction error', { error: e.message }));
            continue;
          }

          const msg = parseIncoming(message);
          if (!msg) continue;
          msg.name = names[message.from] || '';

          logInbound(msg.phone, msg.name, msg.type, msg.logBody, message, message.id, msg.media).catch(() => {});
          handleMessage(msg).catch((e) => logger.error('handleMessage error', { error: e.message, stack: e.stack }));
        }
      }
    }
  } catch (err) {
    logger.error('Webhook processing error', { error: err.message, stack: err.stack });
  }
});

function parseIncoming(message) {
  const phone = message.from;
  const out = { phone, type: 'text', text: '', selectedId: null, logBody: '' };

  switch (message.type) {
    case 'text':
      out.text = message.text?.body || '';
      out.logBody = out.text;
      break;
    case 'interactive': {
      const it = message.interactive || {};
      if (it.type === 'button_reply') {
        out.type = 'button';
        out.selectedId = it.button_reply?.id || '';
        out.text = it.button_reply?.title || '';
        out.logBody = out.text;
      } else if (it.type === 'list_reply') {
        out.type = 'list';
        out.selectedId = it.list_reply?.id || '';
        out.text = it.list_reply?.title || '';
        out.logBody = out.text;
      } else if (it.type === 'nfm_reply') {
        out.type = 'flow';
        out.logBody = 'Book Demo submitted';
        try {
          out.flowResponse =
            typeof it.nfm_reply?.response_json === 'string'
              ? JSON.parse(it.nfm_reply.response_json)
              : it.nfm_reply?.response_json || {};
        } catch {
          out.flowResponse = {};
        }
      }
      break;
    }
    case 'image':
      out.type = 'image';
      out.media = { id: message.image?.id, mime: message.image?.mime_type, caption: message.image?.caption || '' };
      out.logBody = message.image?.caption || '📷 Photo';
      break;
    case 'video':
      out.type = 'video';
      out.media = { id: message.video?.id, mime: message.video?.mime_type, caption: message.video?.caption || '' };
      out.logBody = message.video?.caption || '🎥 Video';
      break;
    case 'audio':
      out.type = 'audio';
      out.media = { id: message.audio?.id, mime: message.audio?.mime_type, caption: '' };
      out.logBody = '🎵 Audio';
      break;
    case 'document':
      out.type = 'document';
      out.media = { id: message.document?.id, mime: message.document?.mime_type, filename: message.document?.filename || 'Document', caption: message.document?.caption || '' };
      out.logBody = message.document?.filename || '📄 Document';
      break;
    case 'sticker':
      out.type = 'image';
      out.media = { id: message.sticker?.id, mime: message.sticker?.mime_type, caption: '' };
      out.logBody = 'Sticker';
      break;
    default:
      out.text = '';
  }

  const hasContent = out.text || out.selectedId || out.type === 'flow' || out.media;
  return hasContent ? out : null;
}

function timingSafeEqual(a, b) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export default router;
