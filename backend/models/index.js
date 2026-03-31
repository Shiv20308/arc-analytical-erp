const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ─── USER MODEL ───────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['admin', 'sales', 'engineer'], default: 'sales' },
  phone: { type: String },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);

// ─── CLIENT MODEL ─────────────────────────────────────────────────────────────
const clientSchema = new mongoose.Schema({
  companyName: { type: String, required: true, trim: true },
  contactPerson: { type: String, required: true },
  designation: { type: String },
  phone: { type: String, required: true },
  altPhone: { type: String },
  email: { type: String, lowercase: true },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  gst: { type: String },
  notes: { type: String },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

clientSchema.index({ companyName: 'text', contactPerson: 'text', email: 'text' });

const Client = mongoose.model('Client', clientSchema);

// ─── CONTRACT MODEL ────────────────────────────────────────────────────────────
const contractSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  contractType: { type: String, enum: ['AMC', 'CMC'], required: true },
  contractNo: { type: String, unique: true },
  instrumentType: { type: String, required: true }, // HPLC, GC, UV, etc.
  instrumentModel: { type: String },
  instrumentSerial: { type: String },
  manufacturer: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  value: { type: Number, default: 0 },
  pmVisitsPerYear: { type: Number, default: 2 },
  pmVisitsCompleted: { type: Number, default: 0 },
  includesBreakdown: { type: Boolean, default: false },
  includesParts: { type: Boolean, default: false },
  includesConsumables: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'expired', 'cancelled', 'pending'], default: 'active' },
  reminderSent30: { type: Boolean, default: false },
  reminderSent7: { type: Boolean, default: false },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const Contract = mongoose.model('Contract', contractSchema);

// ─── VISIT MODEL ──────────────────────────────────────────────────────────────
const visitSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  contractId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract' },
  engineerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  visitType: { type: String, enum: ['PM', 'Breakdown', 'Installation', 'Demo', 'Other'], default: 'PM' },
  status: { type: String, enum: ['scheduled', 'pending', 'in-progress', 'completed', 'cancelled'], default: 'scheduled' },
  scheduledDate: { type: Date, required: true },
  completedDate: { type: Date },
  problemDescription: { type: String },
  workDone: { type: String },
  partsUsed: [{ partName: String, quantity: Number, cost: Number }],
  reportNotes: { type: String },
  customerSignature: { type: Boolean, default: false },
  attachments: [{ filename: String, path: String, uploadedAt: { type: Date, default: Date.now } }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const Visit = mongoose.model('Visit', visitSchema);

// ─── QUOTATION MODEL ──────────────────────────────────────────────────────────
const quotationItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  unit: { type: String, default: 'Nos' },
  unitPrice: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  amount: { type: Number, required: true },
  modelNo: { type: String },
  hsnCode: { type: String },
}, { _id: false });

const quotationSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  quotationNo: { type: String, unique: true },
  subject: { type: String },
  items: [quotationItemSchema],
  subtotal: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  gstPercent: { type: Number, default: 18 },
  gstAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  validityDays: { type: Number, default: 30 },
  status: {
    type: String,
    enum: ['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted'],
    default: 'draft'
  },
  followUpDate: { type: Date },
  notes: { type: String },
  terms: { type: String },
  pdfPath: { type: String },
  sentAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const Quotation = mongoose.model('Quotation', quotationSchema);

// ─── INVOICE MODEL ────────────────────────────────────────────────────────────
const invoiceSchema = new mongoose.Schema({
  quotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  invoiceNo: { type: String, unique: true },
  items: [quotationItemSchema],
  subtotal: { type: Number, default: 0 },
  gstPercent: { type: Number, default: 18 },
  gstAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  invoiceDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
  status: { type: String, enum: ['unpaid', 'paid', 'partial', 'overdue'], default: 'unpaid' },
  taxType: { type: String, enum: ['intra', 'inter'], default: 'intra' },
  poNumber: { type: String },
  paidAmount: { type: Number, default: 0 },
  pdfPath: { type: String },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const Invoice = mongoose.model('Invoice', invoiceSchema);

// ─── PURCHASE ORDER MODEL ─────────────────────────────────────────────────────
const poSchema = new mongoose.Schema({
  quotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  poNumber: { type: String, required: true },
  poDate: { type: Date },
  poValue: { type: Number },
  receivedDate: { type: Date, default: Date.now },
  dispatchStatus: {
    type: String,
    enum: ['pending', 'processing', 'dispatched', 'delivered', 'cancelled'],
    default: 'pending'
  },
  dispatchDate: { type: Date },
  courierName: { type: String },
  trackingNo: { type: String },
  deliveryDate: { type: Date },
  items: [{ description: String, quantity: Number, unit: String }],
  notes: { type: String },
  poDocument: { type: String }, // uploaded PO scan path
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const PurchaseOrder = mongoose.model('PurchaseOrder', poSchema);

// ─── FOLLOW-UP MODEL ──────────────────────────────────────────────────────────
const followupSchema = new mongoose.Schema({
  quotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['call', 'email', 'visit', 'whatsapp', 'other'], default: 'call' },
  status: { type: String, enum: ['pending', 'done', 'rescheduled', 'cancelled'], default: 'pending' },
  notes: { type: String },
  followUpDate: { type: Date, required: true },
  completedAt: { type: Date },
  outcome: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const FollowUp = mongoose.model('FollowUp', followupSchema);

// ─── SETTINGS MODEL ───────────────────────────────────────────────────────────
const settingsSchema = new mongoose.Schema({
  companyName: { type: String, default: 'Arc Analytical' },
  tagline: { type: String, default: 'Analytical Instruments & Services' },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  phone: { type: String },
  altPhone: { type: String },
  email: { type: String },
  website: { type: String },
  gst: { type: String },
  pan: { type: String },
  logoPath: { type: String },
  bankName: { type: String },
  accountNo: { type: String },
  ifsc: { type: String },
  accountHolder: { type: String },
  quotationTerms: { type: String, default: 'Payment due within 30 days of invoice.\nPrices are exclusive of taxes unless mentioned.\nDelivery charges extra as applicable.' },
  invoiceTerms: { type: String, default: 'Thank you for your business!' },
  swiftCode: { type: String, default: 'INDBINBBCHS' },
  ieCode: { type: String, default: 'GEGPS4510P' },
  quotationPrefix: { type: String, default: 'QT' },
  invoicePrefix: { type: String, default: 'INV' },
  contractPrefix: { type: String, default: 'CON' },
  emailSignature: { type: String },
}, { timestamps: true });

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = { User, Client, Contract, Visit, Quotation, Invoice, PurchaseOrder, FollowUp, Settings };
