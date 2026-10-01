import mongoose from 'mongoose';

// Admin-managed key/value assets + copy used across WhatsApp messages/flow.
// Keys: welcome_header_image, welcome_body, flow_header_image, demo_success_image,
// demo_success_body, already_booked_image, already_booked_body, book_demo_cta.
const FlowSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    label: { type: String, default: '' },
    type: { type: String, enum: ['image', 'text'], default: 'text' },
    value: { type: String, default: '' } // image URL or text copy
  },
  { timestamps: true }
);

export default mongoose.models.FlowSetting || mongoose.model('FlowSetting', FlowSettingSchema);
