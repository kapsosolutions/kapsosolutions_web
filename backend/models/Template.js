import mongoose from 'mongoose';

// Local mirror of WhatsApp message templates created from the CRM.
const TemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    metaId: { type: String, default: '' },
    language: { type: String, default: 'en_US' },
    category: { type: String, default: 'MARKETING' }, // MARKETING | UTILITY | AUTHENTICATION
    status: { type: String, default: 'PENDING' },     // PENDING | APPROVED | REJECTED
    bodyText: { type: String, default: '' },
    headerText: { type: String, default: '' },
    headerMediaUrl: { type: String, default: '' }, // Cloudinary URL of the image/video header
    footerText: { type: String, default: '' },
    components: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true }
);

export default mongoose.models.Template || mongoose.model('Template', TemplateSchema);
