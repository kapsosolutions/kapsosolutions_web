import mongoose from 'mongoose';

// A booked demo request, keyed by the customer's WhatsApp number (deduped).
const DemoLeadSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true, index: true }, // WhatsApp number (locked)
    name: { type: String, default: '' },
    businessName: { type: String, default: '' },
    businessAddress: { type: String, default: '' },
    category: { type: String, default: '' },
    categorySlug: { type: String, default: '' },
    altMobile: { type: String, default: '' },
    email: { type: String, default: '' },
    source: { type: String, default: 'whatsapp' }, // whatsapp | website
    status: { type: String, enum: ['New', 'Contacted', 'Completed'], default: 'New' }
  },
  { timestamps: true }
);

export default mongoose.models.DemoLead || mongoose.model('DemoLead', DemoLeadSchema);
