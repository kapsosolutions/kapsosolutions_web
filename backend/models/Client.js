import mongoose from 'mongoose';

// A paying client (for invoices/receipts), managed from the admin Clients page.
const ClientSchema = new mongoose.Schema(
  {
    businessName: { type: String, required: true },
    whatsapp: { type: String, default: '' }, // WhatsApp number (digits)
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    category: { type: String, default: '' },
    address: { type: String, default: '' },
    setupCost: { type: Number, default: 0 },      // one-time setup cost
    monthlyCharge: { type: Number, default: 0 },   // per-month charge
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

export default mongoose.models.Client || mongoose.model('Client', ClientSchema);
