// Meta WhatsApp Cloud API client (single WhatsApp number).
import axios from 'axios';
import https from 'https';
import FormData from 'form-data';
import logger from './logger.js';
import cloudinaryService from './cloudinary.js';
import Message from '../models/Message.js';
import { emitMessage } from './eventBus.js';

const agent = new https.Agent({ keepAlive: true, maxSockets: 25, timeout: 60000 });
const api = axios.create({ httpsAgent: agent, timeout: 20000, headers: { 'Content-Type': 'application/json' } });

const GRAPH = () => `https://graph.facebook.com/${process.env.WA_GRAPH_VERSION || 'v21.0'}`;

const cfg = () => ({
  token: process.env.WA_TOKEN,
  phoneNumberId: process.env.WA_PHONE_NUMBER_ID,
  wabaId: process.env.WA_WABA_ID
});

const clean = (phone) => String(phone || '').replace('@c.us', '').replace(/\D/g, '');
const authHeaders = () => ({ Authorization: `Bearer ${cfg().token}` });
const base = () => `${GRAPH()}/${cfg().phoneNumberId}`;
const originalUrl = (url) => cloudinaryService.getOptimizedUrl(url, 'original');

// Describe an outbound payload so the CRM renders it richly.
function describeOutbound(payload) {
  const type = payload.type;
  const d = { type, body: '', headerImageUrl: '', headerText: '', footer: '', buttons: [], cta: null, flowCta: '', mediaUrl: '', mediaType: '', filename: '' };
  if (type === 'text') {
    d.body = payload.text?.body || '';
  } else if (type === 'image') {
    d.mediaType = 'image';
    d.mediaUrl = payload.image?.link || '';
    d.headerImageUrl = payload.image?.link || '';
    d.body = payload.image?.caption || '';
  } else if (type === 'video') {
    d.mediaType = 'video';
    d.mediaUrl = payload.video?.link || '';
    d.body = payload.video?.caption || '';
  } else if (type === 'audio') {
    d.mediaType = 'audio';
    d.mediaUrl = payload.audio?.link || '';
    d.body = '';
  } else if (type === 'document') {
    d.mediaType = 'document';
    d.mediaUrl = payload.document?.link || '';
    d.filename = payload.document?.filename || 'Document';
    d.body = payload.document?.caption || '';
  } else if (type === 'template') {
    d.body = `Template: ${payload.template?.name || ''}`;
  } else if (type === 'interactive') {
    const it = payload.interactive || {};
    d.body = it.body?.text || '';
    d.footer = it.footer?.text || '';
    if (it.header?.type === 'image') d.headerImageUrl = it.header.image?.link || '';
    if (it.header?.type === 'text') d.headerText = it.header.text || '';
    if (it.type === 'button') {
      d.buttons = (it.action?.buttons || []).map((b) => ({ text: b.reply?.title || '', kind: 'reply' })).filter((b) => b.text);
    } else if (it.type === 'cta_url') {
      d.cta = { text: it.action?.parameters?.display_text || 'Open', url: it.action?.parameters?.url || '' };
    } else if (it.type === 'flow') {
      d.flowCta = it.action?.parameters?.flow_cta || 'Open';
      d.buttons = [{ text: d.flowCta, kind: 'flow' }];
    }
  } else {
    return null;
  }
  if (!d.body) {
    const mediaLabel = { image: '📷 Photo', video: '🎥 Video', audio: '🎵 Audio', document: '📄 Document' }[d.mediaType];
    d.body = d.flowCta || d.buttons[0]?.text || d.headerText || mediaLabel || '';
  }
  return d;
}

async function logOutbound(payload, resData) {
  try {
    const d = describeOutbound(payload);
    if (!d) return;
    const phone = String(payload.to || '').replace(/\D/g, '');
    if (!phone) return;
    const doc = await Message.create({
      phone, direction: 'out', type: d.type, body: d.body,
      raw: { outbound: d }, metaMessageId: resData?.messages?.[0]?.id
    });
    emitMessage(doc);
  } catch (err) {
    logger.warn('logOutbound failed', { error: err.message });
  }
}

async function post(payload) {
  const res = await api.post(`${base()}/messages`, payload, { headers: authHeaders() });
  logOutbound(payload, res?.data);
  return res;
}

const metaCloud = {
  async sendText(phone, body) {
    try {
      const { data } = await post({ messaging_product: 'whatsapp', to: clean(phone), type: 'text', text: { body } });
      return data;
    } catch (err) {
      logger.error('sendText error', { error: err.response?.data?.error?.message || err.message });
      throw err;
    }
  },

  // Image header + body + reply buttons (used for the "hi" welcome + Book Demo button).
  async sendImageWithButtons(phone, imageUrl, body, buttons, footer = '') {
    try {
      const payload = {
        messaging_product: 'whatsapp', to: clean(phone), type: 'interactive',
        interactive: {
          type: 'button',
          header: { type: 'image', image: { link: originalUrl(imageUrl) } },
          body: { text: body },
          ...(footer ? { footer: { text: footer } } : {}),
          action: {
            buttons: buttons.slice(0, 3).map((b, i) => ({
              type: 'reply', reply: { id: b.id || String(i + 1), title: (b.text || b).substring(0, 20) }
            }))
          }
        }
      };
      const { data } = await post(payload);
      return data;
    } catch (err) {
      logger.error('sendImageWithButtons error', { error: err.response?.data?.error?.message || err.message });
      return this.sendButtons(phone, body, buttons, footer);
    }
  },

  async sendButtons(phone, body, buttons, footer = '') {
    try {
      const payload = {
        messaging_product: 'whatsapp', to: clean(phone), type: 'interactive',
        interactive: {
          type: 'button', body: { text: body },
          ...(footer ? { footer: { text: footer } } : {}),
          action: {
            buttons: buttons.slice(0, 3).map((b, i) => ({
              type: 'reply', reply: { id: b.id || String(i + 1), title: (b.text || b).substring(0, 20) }
            }))
          }
        }
      };
      const { data } = await post(payload);
      return data;
    } catch (err) {
      logger.error('sendButtons error', { error: err.response?.data?.error?.message || err.message });
      return this.sendText(phone, `${body}\n\n${buttons.map((b, i) => `${i + 1}. ${b.text || b}`).join('\n')}`);
    }
  },

  // Image header + body + single CTA URL button (used for success + already-booked).
  async sendCtaUrl(phone, body, buttonText, url, footer = '', imageUrl = null) {
    try {
      const payload = {
        messaging_product: 'whatsapp', to: clean(phone), type: 'interactive',
        interactive: {
          type: 'cta_url',
          ...(imageUrl ? { header: { type: 'image', image: { link: originalUrl(imageUrl) } } } : {}),
          body: { text: body },
          ...(footer ? { footer: { text: footer } } : {}),
          action: { name: 'cta_url', parameters: { display_text: buttonText, url } }
        }
      };
      const { data } = await post(payload);
      return data;
    } catch (err) {
      logger.error('sendCtaUrl error', { error: err.response?.data?.error?.message || err.message });
      return this.sendText(phone, `${body}\n\n${buttonText}: ${url}`);
    }
  },

  async sendImage(phone, imageUrl, caption = '') {
    try {
      const { data } = await post({
        messaging_product: 'whatsapp', to: clean(phone), type: 'image',
        image: { link: originalUrl(imageUrl), caption }
      });
      return data;
    } catch (err) {
      logger.error('sendImage error', { error: err.response?.data?.error?.message || err.message });
      return this.sendText(phone, caption);
    }
  },

  async sendVideo(phone, videoUrl, caption = '') {
    const { data } = await post({
      messaging_product: 'whatsapp', to: clean(phone), type: 'video', video: { link: videoUrl, caption }
    });
    return data;
  },

  async sendAudio(phone, audioUrl) {
    const { data } = await post({
      messaging_product: 'whatsapp', to: clean(phone), type: 'audio', audio: { link: audioUrl }
    });
    return data;
  },

  async sendDocument(phone, documentUrl, filename, caption = '') {
    const { data } = await post({
      messaging_product: 'whatsapp', to: clean(phone), type: 'document',
      document: { link: documentUrl, filename, ...(caption ? { caption } : {}) }
    });
    return data;
  },

  // Upload an in-memory buffer (e.g. a generated PDF) to WhatsApp's /media
  // endpoint and return its media id. This keeps generated invoices OFF Cloudinary
  // — the bytes live only on Meta's media store, referenced by id when sending.
  async uploadMedia(buffer, { mimeType = 'application/pdf', filename = 'file.pdf' } = {}) {
    const form = new FormData();
    form.append('messaging_product', 'whatsapp');
    form.append('type', mimeType);
    form.append('file', buffer, { filename, contentType: mimeType });
    const { data } = await api.post(`${base()}/media`, form, {
      headers: { ...authHeaders(), ...form.getHeaders() },
      maxContentLength: 20 * 1024 * 1024, maxBodyLength: 20 * 1024 * 1024
    });
    return data?.id;
  },

  // Send a document that was previously uploaded via uploadMedia (by media id).
  async sendDocumentMedia(phone, mediaId, filename, caption = '') {
    const { data } = await post({
      messaging_product: 'whatsapp', to: clean(phone), type: 'document',
      document: { id: mediaId, filename, ...(caption ? { caption } : {}) }
    });
    return data;
  },

  // Download inbound media bytes from Meta (two-step: get URL, then fetch bytes).
  async downloadMedia(mediaId) {
    const meta = await axios.get(`${GRAPH()}/${mediaId}`, { headers: authHeaders() });
    const mediaUrl = meta.data?.url;
    const mime = meta.data?.mime_type || 'application/octet-stream';
    const file = await axios.get(mediaUrl, { headers: authHeaders(), responseType: 'arraybuffer' });
    return { buffer: Buffer.from(file.data), mime };
  },

  // Interactive WhatsApp Flow message (opens the Book Demo flow).
  async sendFlowMessage(phone, options) {
    const {
      flowId, flowCta, headerText, headerImageUrl, bodyText, footerText,
      screenName, screenData = {}, flowToken = 'unused', mode = 'published', flowAction = 'navigate'
    } = options;
    try {
      const header = headerImageUrl
        ? { type: 'image', image: { link: originalUrl(headerImageUrl) } }
        : { type: 'text', text: headerText || 'Kapso Solutions' };
      const actionParams = {
        flow_message_version: '3', flow_token: flowToken, flow_id: flowId,
        flow_cta: flowCta, mode, flow_action: flowAction
      };
      if (flowAction === 'navigate') {
        actionParams.flow_action_payload = { screen: screenName, data: { ...screenData, flow_token: flowToken } };
      }
      const payload = {
        messaging_product: 'whatsapp', recipient_type: 'individual', to: clean(phone), type: 'interactive',
        interactive: {
          type: 'flow', header, body: { text: bodyText || ' ' },
          ...(footerText ? { footer: { text: footerText } } : {}),
          action: { name: 'flow', parameters: actionParams }
        }
      };
      const { data } = await post(payload);
      return data;
    } catch (err) {
      logger.error('sendFlowMessage error', { flowId, error: err.response?.data?.error?.message || err.message, details: err.response?.data?.error?.error_data });
      throw err;
    }
  },

  // React to a message with an emoji (empty emoji removes the reaction).
  async sendReaction(phone, messageId, emoji) {
    const { data } = await post({
      messaging_product: 'whatsapp', to: clean(phone), type: 'reaction',
      reaction: { message_id: messageId, emoji: emoji || '' }
    });
    return data;
  },

  async markRead(messageId) {
    try {
      await api.post(`${base()}/messages`, { messaging_product: 'whatsapp', status: 'read', message_id: messageId }, { headers: authHeaders() });
    } catch (err) {
      logger.debug('markRead failed', { error: err.message });
    }
  },

  // ---------- Templates (WABA-level) ----------
  async listTemplates() {
    const { data } = await api.get(`${GRAPH()}/${cfg().wabaId}/message_templates`, { headers: authHeaders(), params: { limit: 200 } });
    return data?.data || [];
  },
  async createTemplate(payload) {
    const { data } = await api.post(`${GRAPH()}/${cfg().wabaId}/message_templates`, payload, { headers: authHeaders() });
    return data;
  },
  async deleteTemplate(name) {
    const { data } = await api.delete(`${GRAPH()}/${cfg().wabaId}/message_templates`, { headers: authHeaders(), params: { name } });
    return data;
  },

  // Resumable upload of a media header sample -> returns the header_handle Meta
  // requires when creating a template with an IMAGE header.
  async uploadHeaderSample({ fileUrl, fileName = 'header', fileType = 'image/jpeg' }) {
    const appId = process.env.WA_APP_ID;
    const appSecret = process.env.WA_APP_SECRET;
    if (!appId || !appSecret) throw new Error('WA_APP_ID / WA_APP_SECRET not configured for header upload');

    const fileResp = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(fileResp.data);
    const mime = (fileResp.headers['content-type'] || fileType).split(';')[0].trim().toLowerCase();

    const appAccessToken = `${appId}|${appSecret}`;
    const createResp = await axios.post(`${GRAPH()}/${appId}/uploads`, null, {
      params: { file_name: fileName, file_length: buffer.length, file_type: mime, access_token: appAccessToken }
    });
    const sessionId = createResp.data.id;

    const uploadResp = await axios.post(`${GRAPH()}/${sessionId}`, buffer, {
      headers: { Authorization: `OAuth ${cfg().token}`, file_offset: '0', 'Content-Type': mime },
      maxBodyLength: Infinity, maxContentLength: Infinity
    });
    const handle = uploadResp.data?.h;
    if (!handle) throw new Error('No header handle returned from Meta upload');
    return handle;
  },
  async sendTemplate(phone, templateName, { languageCode = 'en_US', headerImageUrl = null, headerDocumentMediaId = null, headerDocumentFilename = 'document.pdf', bodyParams = [] } = {}) {
    const components = [];
    if (headerDocumentMediaId) {
      components.push({ type: 'header', parameters: [{ type: 'document', document: { id: headerDocumentMediaId, filename: headerDocumentFilename } }] });
    } else if (headerImageUrl) {
      components.push({ type: 'header', parameters: [{ type: 'image', image: { link: originalUrl(headerImageUrl) } }] });
    }
    if (bodyParams.length) components.push({ type: 'body', parameters: bodyParams.map((t) => ({ type: 'text', text: String(t) })) });
    const { data } = await post({
      messaging_product: 'whatsapp', to: clean(phone), type: 'template',
      template: { name: templateName, language: { code: languageCode }, ...(components.length ? { components } : {}) }
    });
    return data;
  },

  // ---------- Flow management ----------
  async createFlow(name, categories = ['OTHER'], { endpointUri = null } = {}) {
    const body = { name, categories };
    if (endpointUri) body.endpoint_uri = endpointUri;
    const { data } = await api.post(`${GRAPH()}/${cfg().wabaId}/flows`, body, { headers: authHeaders() });
    return data;
  },
  async updateFlowJSON(flowId, flowJsonObj) {
    const form = new FormData();
    form.append('file', Buffer.from(JSON.stringify(flowJsonObj)), { filename: 'flow.json', contentType: 'application/json' });
    form.append('name', 'flow.json');
    form.append('asset_type', 'FLOW_JSON');
    const { data } = await api.post(`${GRAPH()}/${flowId}/assets`, form, {
      headers: { ...authHeaders(), ...form.getHeaders() }, maxContentLength: 10485760, maxBodyLength: 10485760
    });
    return data;
  },
  async publishFlow(flowId) {
    const { data } = await api.post(`${GRAPH()}/${flowId}/publish`, {}, { headers: authHeaders() });
    return data;
  },
  async getFlows() {
    const { data } = await api.get(`${GRAPH()}/${cfg().wabaId}/flows?fields=id,name,status,categories&limit=100`, { headers: authHeaders() });
    return data?.data || [];
  },
  async updateFlowEndpoint(flowId, endpointUri) {
    const { data } = await api.post(`${GRAPH()}/${flowId}`, { endpoint_uri: endpointUri }, { headers: authHeaders() });
    return data;
  },

  config: cfg
};

export default metaCloud;
