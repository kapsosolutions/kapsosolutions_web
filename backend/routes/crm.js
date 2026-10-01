import express from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { uploadMedia } from '../middleware/upload.js';
import cloudinaryService from '../services/cloudinary.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Template from '../models/Template.js';
import metaCloud from '../services/metaCloud.js';
import { touchOutbound } from '../services/conversationState.js';
import { emitReaction } from '../services/eventBus.js';
import logger from '../services/logger.js';

const router = express.Router();
router.use(requireAdmin);

// ---------------- Delete a whole chat (messages + conversation + media) ----------------
router.delete('/chats/:phone', async (req, res) => {
  try {
    const phone = req.params.phone.replace(/\D/g, '');
    if (!phone) return res.status(400).json({ success: false, message: 'phone required' });

    const messages = await Message.find({ phone }).lean();

    // Collect every Cloudinary asset used in this chat (inbound + outbound media).
    const urls = new Set();
    for (const m of messages) {
      const u1 = m.raw?.media?.url;
      const u2 = m.raw?.outbound?.mediaUrl;
      if (u1) urls.add(u1);
      if (u2) urls.add(u2);
    }
    for (const url of urls) {
      // eslint-disable-next-line no-await-in-loop
      await cloudinaryService.deleteByUrl(url).catch(() => {});
    }

    await Message.deleteMany({ phone });
    await Conversation.deleteOne({ phone });

    res.json({ success: true, deletedMessages: messages.length, deletedMedia: urls.size });
  } catch (err) {
    logger.error('crm delete chat failed', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------- Conversations (chat list) ----------------
router.get('/chats', async (_req, res) => {
  const chats = await Conversation.find().sort({ lastInboundAt: -1 }).limit(200).lean();
  const now = Date.now();
  const data = chats.map((c) => {
    const lastInbound = c.lastInboundAt ? new Date(c.lastInboundAt).getTime() : 0;
    const windowMsLeft = Math.max(0, 24 * 60 * 60 * 1000 - (now - lastInbound));
    return { ...c, windowOpen: windowMsLeft > 0, windowMsLeft };
  });
  res.json({ success: true, data });
});

// ---------------- Messages for a phone ----------------
router.get('/messages/:phone', async (req, res) => {
  const phone = req.params.phone.replace(/\D/g, '');
  const messages = await Message.find({ phone }).sort({ createdAt: 1 }).limit(500).lean();
  await Conversation.updateOne({ phone }, { $set: { unread: 0 } });
  res.json({ success: true, data: messages });
});

// ---------------- Send a free-text reply (within 24h window) ----------------
router.post('/send', async (req, res) => {
  try {
    const { phone, text } = req.body || {};
    if (!phone || !text?.trim()) return res.status(400).json({ success: false, message: 'phone and text required' });
    const clean = String(phone).replace(/\D/g, '');
    await metaCloud.sendText(clean, text.trim());
    await touchOutbound(clean, text.trim());
    res.json({ success: true });
  } catch (err) {
    logger.error('crm send failed', { error: err.response?.data?.error?.message || err.message });
    res.status(500).json({ success: false, message: err.response?.data?.error?.message || err.message });
  }
});

// ---------------- React to a message with an emoji ----------------
router.post('/react', async (req, res) => {
  try {
    const { phone, messageId, emoji } = req.body || {};
    if (!phone || !messageId) return res.status(400).json({ success: false, message: 'phone and messageId required' });
    const clean = String(phone).replace(/\D/g, '');
    await metaCloud.sendReaction(clean, messageId, emoji || '');
    await Message.updateOne({ metaMessageId: messageId }, { $set: { reaction: emoji || '' } });
    emitReaction({ metaMessageId: messageId, emoji: emoji || '' });
    res.json({ success: true });
  } catch (err) {
    logger.error('crm react failed', { error: err.response?.data?.error?.message || err.message });
    res.status(500).json({ success: false, message: err.response?.data?.error?.message || err.message });
  }
});

// ---------------- Send a media file (image / video / audio / document) ----------------
router.post('/send-media', uploadMedia.single('file'), async (req, res) => {
  try {
    const { phone, caption } = req.body || {};
    if (!phone || !req.file) return res.status(400).json({ success: false, message: 'phone and file required' });
    const clean = String(phone).replace(/\D/g, '');
    const mime = req.file.mimetype || 'application/octet-stream';

    // WhatsApp media type from the mime.
    let waType = 'document';
    if (mime.startsWith('image/')) waType = 'image';
    else if (mime.startsWith('video/')) waType = 'video';
    else if (mime.startsWith('audio/')) waType = 'audio';

    // Cloudinary resource type: image -> image, video/audio -> video, else raw.
    const resourceType = waType === 'image' ? 'image' : waType === 'video' || waType === 'audio' ? 'video' : 'raw';
    const url = await cloudinaryService.uploadBuffer(req.file.buffer, 'kapso/crm', resourceType);
    const filename = req.file.originalname || 'file';

    if (waType === 'image') await metaCloud.sendImage(clean, url, caption || '');
    else if (waType === 'video') await metaCloud.sendVideo(clean, url, caption || '');
    else if (waType === 'audio') await metaCloud.sendAudio(clean, url);
    else await metaCloud.sendDocument(clean, url, filename, caption || '');

    await touchOutbound(clean, `[${waType}] ${caption || filename}`);
    res.json({ success: true });
  } catch (err) {
    logger.error('crm send-media failed', { error: err.response?.data?.error?.message || err.message });
    res.status(500).json({ success: false, message: err.response?.data?.error?.message || err.message });
  }
});

// ---------------- Send an approved template (outside 24h window) ----------------
router.post('/send-template', async (req, res) => {
  try {
    const { phone, templateName, languageCode, headerImageUrl, bodyParams } = req.body || {};
    if (!phone || !templateName) return res.status(400).json({ success: false, message: 'phone and templateName required' });
    const clean = String(phone).replace(/\D/g, '');
    await metaCloud.sendTemplate(clean, templateName, { languageCode, headerImageUrl, bodyParams: bodyParams || [] });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.response?.data?.error?.message || err.message });
  }
});

// ---------------- Templates ----------------
router.get('/templates', async (_req, res) => {
  try {
    const locals = await Template.find().lean();
    const byName = {};
    locals.forEach((l) => (byName[l.name] = l));

    // Prefer live Meta status; enrich each with the local header media URL
    // (Meta only returns a header handle, not a viewable image URL).
    const remote = await metaCloud.listTemplates().catch(() => null);
    if (remote) {
      const merged = remote.map((r) => ({ ...r, headerMediaUrl: byName[r.name]?.headerMediaUrl || '' }));
      return res.json({ success: true, data: merged });
    }
    res.json({ success: true, data: locals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/templates', uploadMedia.single('headerMedia'), async (req, res) => {
  try {
    const { name, language = 'en', category = 'MARKETING', headerType = 'none', headerText, bodyText, footerText, buttons } = req.body || {};
    if (!name?.trim() || !bodyText?.trim()) {
      return res.status(400).json({ success: false, message: 'name and bodyText are required' });
    }

    const components = [];
    let headerMediaUrl = '';

    // Header: none | text | image | video
    if (headerType === 'text' && headerText?.trim()) {
      components.push({ type: 'HEADER', format: 'TEXT', text: headerText.trim() });
    } else if ((headerType === 'image' || headerType === 'video')) {
      if (!req.file) return res.status(400).json({ success: false, message: `A ${headerType} file is required for this header.` });
      const isVideo = headerType === 'video';
      headerMediaUrl = await cloudinaryService.uploadBuffer(req.file.buffer, 'kapso/templates', isVideo ? 'video' : 'image');
      const handle = await metaCloud.uploadHeaderSample({ fileUrl: headerMediaUrl, fileName: req.file.originalname, fileType: req.file.mimetype });
      components.push({ type: 'HEADER', format: headerType.toUpperCase(), example: { header_handle: [handle] } });
    }

    components.push({ type: 'BODY', text: bodyText.trim() });
    if (footerText?.trim()) components.push({ type: 'FOOTER', text: footerText.trim() });

    // Buttons: reply (QUICK_REPLY), URL (cta), phone (call). Sent as a JSON string.
    let parsedButtons = [];
    if (buttons) {
      try { parsedButtons = typeof buttons === 'string' ? JSON.parse(buttons) : buttons; } catch { parsedButtons = []; }
    }
    if (Array.isArray(parsedButtons) && parsedButtons.length) {
      const btns = parsedButtons
        .map((b) => {
          const text = (b.text || '').trim();
          if (!text) return null;
          if (b.type === 'URL') return { type: 'URL', text, url: (b.url || '').trim() };
          if (b.type === 'PHONE_NUMBER') return { type: 'PHONE_NUMBER', text, phone_number: (b.phone || '').trim() };
          return { type: 'QUICK_REPLY', text };
        })
        .filter((b) => b && (b.type !== 'URL' || b.url) && (b.type !== 'PHONE_NUMBER' || b.phone_number));
      if (btns.length) components.push({ type: 'BUTTONS', buttons: btns });
    }

    const payload = { name: name.trim().toLowerCase().replace(/\s+/g, '_'), language, category, components };
    const created = await metaCloud.createTemplate(payload);

    await Template.findOneAndUpdate(
      { name: payload.name },
      {
        $set: {
          name: payload.name, metaId: created.id || '', language, category,
          status: created.status || 'PENDING', headerText: headerText || '', headerMediaUrl,
          bodyText, footerText: footerText || '', components
        }
      },
      { upsert: true }
    );
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    logger.error('create template failed', { error: err.response?.data?.error?.message || err.message });
    res.status(500).json({ success: false, message: err.response?.data?.error?.message || err.message });
  }
});

router.delete('/templates/:name', async (req, res) => {
  try {
    await metaCloud.deleteTemplate(req.params.name).catch(() => {});
    await Template.deleteOne({ name: req.params.name });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
