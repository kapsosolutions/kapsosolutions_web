import mongoose from 'mongoose';

// CRM chat log — every inbound/outbound WhatsApp message, per phone.
const MessageSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, index: true },
    name: { type: String, default: '' },
    direction: { type: String, enum: ['in', 'out'], required: true },
    type: { type: String, default: 'text' },
    body: { type: String, default: '' },
    raw: { type: mongoose.Schema.Types.Mixed },
    metaMessageId: { type: String, index: true },
    status: { type: String, default: 'sent' }, // sent, delivered, read, failed
    reaction: { type: String, default: '' } // emoji reaction on this message
  },
  { timestamps: true }
);

MessageSchema.index({ phone: 1, createdAt: -1 });

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);
