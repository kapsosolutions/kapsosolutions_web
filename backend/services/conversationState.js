// Conversation state helpers for the CRM 24h window + step tracking.
import Conversation from '../models/Conversation.js';

export async function getConversation(phone) {
  return Conversation.findOne({ phone }).lean();
}

export async function touchInbound(phone, name, body) {
  return Conversation.findOneAndUpdate(
    { phone },
    {
      $set: { lastInboundAt: new Date(), lastMessageBody: body || '', ...(name ? { name } : {}) },
      $inc: { unread: 1 }
    },
    { upsert: true, new: true }
  );
}

export async function touchOutbound(phone, body) {
  return Conversation.findOneAndUpdate(
    { phone },
    { $set: { lastOutboundAt: new Date(), lastMessageBody: body || '', unread: 0 } },
    { upsert: true, new: true }
  );
}

export async function setStep(phone, step, context = {}) {
  return Conversation.findOneAndUpdate(
    { phone },
    { $set: { step, ...(Object.keys(context).length ? { context } : {}) } },
    { upsert: true, new: true }
  );
}

export default { getConversation, touchInbound, touchOutbound, setStep };
