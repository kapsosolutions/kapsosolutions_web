import mongoose from 'mongoose';

// Tracks each WhatsApp user's conversation state + last-message timestamps
// (used by the CRM 24h session timer).
const ConversationSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: '' },
    step: { type: String, default: 'new' },
    context: { type: mongoose.Schema.Types.Mixed, default: {} },
    lastInboundAt: { type: Date, default: Date.now },
    lastOutboundAt: { type: Date },
    lastMessageBody: { type: String, default: '' },
    unread: { type: Number, default: 0 },
    // When true, the bot stops auto-replying so an agent can chat manually.
    botPaused: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
