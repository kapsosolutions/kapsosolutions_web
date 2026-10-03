import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    details: { type: String, default: '' },
    hsn: { type: String, default: '' },
    amount: { type: Number, default: 0 }
  },
  { _id: false }
);

// A generated invoice/estimation, optionally linked to a Client, with Razorpay
// payment artefacts (dynamic UPI QR + payment link) and paid status.
const InvoiceSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, required: true, unique: true, index: true },
    docType: { type: String, default: 'INVOICE' }, // INVOICE | ESTIMATION | TAX INVOICE | ...
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },

    // Snapshot of billed-to details (so the invoice is stable even if client changes).
    billTo: {
      businessName: { type: String, default: '' },
      address: { type: String, default: '' },
      whatsapp: { type: String, default: '' },
      email: { type: String, default: '' }
    },

    date: { type: String, default: '' },
    dueDate: { type: String, default: '' },
    terms: { type: String, default: 'Due on receipt' },

    items: { type: [ItemSchema], default: [] },
    taxType: { type: String, default: 'IGST' }, // IGST | CGST_SGST | NONE
    taxRate: { type: Number, default: 18 },
    subtotal: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    termsList: { type: [String], default: [] },

    // ---- Razorpay payment artefacts ----
    rzpQrId: { type: String, default: '' },
    rzpQrImageUrl: { type: String, default: '' },
    rzpPaymentLinkId: { type: String, default: '' },
    rzpPaymentLinkUrl: { type: String, default: '' },
    rzpPaymentId: { type: String, default: '' },

    status: { type: String, enum: ['Draft', 'Sent', 'Paid'], default: 'Draft', index: true },
    paidAt: { type: Date },
    receiptSent: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);
