// ─── INVOICE CONTROLLER ───────────────────────────────────────────────────────
const { Invoice, Quotation, Client, Visit, Contract, FollowUp, Settings, User, PurchaseOrder } = require('../models');
const { apiResponse, getPagination, getPaginationMeta, generateInvoiceNo } = require('../utils/helpers');
const pdfService = require('../services/pdf.service');
const moment = require('moment');

exports.invoiceController = {
  getAll: async (req, res) => {
    try {
      const { page, limit, skip } = getPagination(req.query);
      const { clientId, status } = req.query;
      const filter = {};
      if (clientId) filter.clientId = clientId;
      if (status) filter.status = status;

      const [invoices, total] = await Promise.all([
        Invoice.find(filter).populate('clientId', 'companyName city').populate('quotationId', 'quotationNo').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Invoice.countDocuments(filter)
      ]);
      apiResponse(res, 200, true, 'Invoices fetched', invoices, getPaginationMeta(total, page, limit));
    } catch (err) { apiResponse(res, 500, false, err.message); }
  },

  getOne: async (req, res) => {
    try {
      const invoice = await Invoice.findById(req.params.id).populate('clientId').populate('quotationId').lean();
      if (!invoice) return apiResponse(res, 404, false, 'Invoice not found');
      apiResponse(res, 200, true, 'Invoice fetched', invoice);
    } catch (err) { apiResponse(res, 500, false, err.message); }
  },

  create: async (req, res) => {
    try {
      const invoiceNo = await generateInvoiceNo();
      const { items, gstPercent = 18 } = req.body;
      const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
      const gstAmount = (subtotal * gstPercent) / 100;
      const totalAmount = subtotal + gstAmount;

      const invoice = await Invoice.create({ ...req.body, invoiceNo, subtotal, gstAmount, totalAmount, createdBy: req.user._id });

      // If from quotation, update quotation status
      if (req.body.quotationId) {
        await Quotation.findByIdAndUpdate(req.body.quotationId, { status: 'converted' });
      }

      await invoice.populate('clientId', 'companyName');
      apiResponse(res, 201, true, 'Invoice created', invoice);
    } catch (err) { apiResponse(res, 500, false, err.message); }
  },

  update: async (req, res) => {
    try {
      const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('clientId', 'companyName');
      if (!invoice) return apiResponse(res, 404, false, 'Invoice not found');
      apiResponse(res, 200, true, 'Invoice updated', invoice);
    } catch (err) { apiResponse(res, 500, false, err.message); }
  },

  generatePDF: async (req, res) => {
    try {
      const invoice = await Invoice.findById(req.params.id).populate('clientId').lean();
      if (!invoice) return apiResponse(res, 404, false, 'Invoice not found');
      const settings = await Settings.findOne().lean();
      const pdfPath = await pdfService.generateInvoicePDF(invoice, settings);
      const path = require('path');
      const filename = path.basename(pdfPath);
      await Invoice.findByIdAndUpdate(req.params.id, { pdfPath });
      apiResponse(res, 200, true, 'PDF generated', { pdfPath, filename, downloadUrl: `/uploads/pdfs/${filename}` });
    } catch (err) { apiResponse(res, 500, false, err.message); }
  }
};

// ─── VISIT CONTROLLER ─────────────────────────────────────────────────────────
exports.visitController = {
  getAll: async (req, res) => {
    try {
      const { page, limit, skip } = getPagination(req.query);
      const { clientId, engineerId, status, visitType } = req.query;
      const filter = {};
      if (clientId) filter.clientId = clientId;
      if (engineerId) filter.engineerId = engineerId;
      if (status) filter.status = status;
      if (visitType) filter.visitType = visitType;

      const [visits, total] = await Promise.all([
        Visit.find(filter)
          .populate('clientId', 'companyName city phone')
          .populate('engineerId', 'name phone')
          .populate('contractId', 'contractType contractNo')
          .sort({ scheduledDate: -1 }).skip(skip).limit(limit).lean(),
        Visit.countDocuments(filter)
      ]);
      apiResponse(res, 200, true, 'Visits fetched', visits, getPaginationMeta(total, page, limit));
    } catch (err) { apiResponse(res, 500, false, err.message); }
  },

  create: async (req, res) => {
    try {
      const visit = await Visit.create({ ...req.body, createdBy: req.user._id });
      await visit.populate('clientId', 'companyName').populate('engineerId', 'name');
      apiResponse(res, 201, true, 'Visit scheduled', visit);
    } catch (err) { apiResponse(res, 500, false, err.message); }
  },

  update: async (req, res) => {
    try {
      if (req.body.status === 'completed' && !req.body.completedDate) {
        req.body.completedDate = new Date();
      }
      const visit = await Visit.findByIdAndUpdate(req.params.id, req.body, { new: true })
        .populate('clientId', 'companyName').populate('engineerId', 'name');
      if (!visit) return apiResponse(res, 404, false, 'Visit not found');

      // If PM visit completed, increment contract counter
      if (req.body.status === 'completed' && visit.contractId && visit.visitType === 'PM') {
        await Contract.findByIdAndUpdate(visit.contractId, { $inc: { pmVisitsCompleted: 1 } });
      }

      apiResponse(res, 200, true, 'Visit updated', visit);
    } catch (err) { apiResponse(res, 500, false, err.message); }
  },

  getOne: async (req, res) => {
    try {
      const visit = await Visit.findById(req.params.id)
        .populate('clientId').populate('engineerId', 'name phone').populate('contractId').lean();
      if (!visit) return apiResponse(res, 404, false, 'Visit not found');
      apiResponse(res, 200, true, 'Visit fetched', visit);
    } catch (err) { apiResponse(res, 500, false, err.message); }
  }
};

// ─── PURCHASE ORDER CONTROLLER ────────────────────────────────────────────────
exports.poController = {
  getAll: async (req, res) => {
    try {
      const { page, limit, skip } = getPagination(req.query);
      const { clientId, dispatchStatus } = req.query;
      const filter = {};
      if (clientId) filter.clientId = clientId;
      if (dispatchStatus) filter.dispatchStatus = dispatchStatus;

      const [pos, total] = await Promise.all([
        PurchaseOrder.find(filter).populate('clientId', 'companyName city').populate('quotationId', 'quotationNo totalAmount').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        PurchaseOrder.countDocuments(filter)
      ]);
      apiResponse(res, 200, true, 'Purchase orders fetched', pos, getPaginationMeta(total, page, limit));
    } catch (err) { apiResponse(res, 500, false, err.message); }
  },

  create: async (req, res) => {
    try {
      const po = await PurchaseOrder.create({ ...req.body, createdBy: req.user._id });
      await po.populate('clientId', 'companyName');
      apiResponse(res, 201, true, 'Purchase order created', po);
    } catch (err) { apiResponse(res, 500, false, err.message); }
  },

  update: async (req, res) => {
    try {
      const po = await PurchaseOrder.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('clientId', 'companyName');
      if (!po) return apiResponse(res, 404, false, 'PO not found');
      apiResponse(res, 200, true, 'PO updated', po);
    } catch (err) { apiResponse(res, 500, false, err.message); }
  },

  getOne: async (req, res) => {
    try {
      const po = await PurchaseOrder.findById(req.params.id).populate('clientId').populate('quotationId').lean();
      if (!po) return apiResponse(res, 404, false, 'PO not found');
      apiResponse(res, 200, true, 'PO fetched', po);
    } catch (err) { apiResponse(res, 500, false, err.message); }
  }
};

// ─── FOLLOW-UP CONTROLLER ─────────────────────────────────────────────────────
exports.followupController = {
  getAll: async (req, res) => {
    try {
      const { page, limit, skip } = getPagination(req.query);
      const { status, assignedTo, clientId, upcoming } = req.query;
      const filter = {};
      if (status) filter.status = status;
      if (assignedTo) filter.assignedTo = assignedTo;
      if (clientId) filter.clientId = clientId;
      if (upcoming === 'true') {
        filter.followUpDate = { $gte: moment().startOf('day').toDate(), $lte: moment().add(7, 'days').endOf('day').toDate() };
        filter.status = 'pending';
      }

      const [followups, total] = await Promise.all([
        FollowUp.find(filter)
          .populate('clientId', 'companyName contactPerson phone')
          .populate('quotationId', 'quotationNo totalAmount')
          .populate('assignedTo', 'name')
          .sort({ followUpDate: 1 }).skip(skip).limit(limit).lean(),
        FollowUp.countDocuments(filter)
      ]);
      apiResponse(res, 200, true, 'Follow-ups fetched', followups, getPaginationMeta(total, page, limit));
    } catch (err) { apiResponse(res, 500, false, err.message); }
  },

  create: async (req, res) => {
    try {
      const followup = await FollowUp.create({ ...req.body, createdBy: req.user._id });
      await followup.populate('clientId', 'companyName').populate('quotationId', 'quotationNo');
      apiResponse(res, 201, true, 'Follow-up created', followup);
    } catch (err) { apiResponse(res, 500, false, err.message); }
  },

  update: async (req, res) => {
    try {
      if (req.body.status === 'done') req.body.completedAt = new Date();
      const followup = await FollowUp.findByIdAndUpdate(req.params.id, req.body, { new: true })
        .populate('clientId', 'companyName').populate('quotationId', 'quotationNo');
      if (!followup) return apiResponse(res, 404, false, 'Follow-up not found');
      apiResponse(res, 200, true, 'Follow-up updated', followup);
    } catch (err) { apiResponse(res, 500, false, err.message); }
  }
};

// ─── DASHBOARD CONTROLLER ─────────────────────────────────────────────────────
exports.dashboardController = {
  getStats: async (req, res) => {
    try {
      const now = new Date();
      const startOfMonth = moment().startOf('month').toDate();
      const endOfMonth = moment().endOf('month').toDate();

      const [
        totalClients,
        activeContracts,
        amcCount,
        cmcCount,
        expiringContracts,
        pendingVisits,
        quotationsThisMonth,
        invoicesThisMonth,
        pendingFollowups,
        pendingPOs,
        recentQuotations,
        visitsByStatus,
        monthlyRevenue
      ] = await Promise.all([
        Client.countDocuments({ isActive: true }),
        Contract.countDocuments({ status: 'active' }),
        Contract.countDocuments({ status: 'active', contractType: 'AMC' }),
        Contract.countDocuments({ status: 'active', contractType: 'CMC' }),
        Contract.countDocuments({ status: 'active', endDate: { $lte: moment().add(30, 'days').toDate(), $gte: now } }),
        Visit.countDocuments({ status: { $in: ['scheduled', 'pending'] } }),
        Quotation.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
        Invoice.countDocuments({ invoiceDate: { $gte: startOfMonth, $lte: endOfMonth } }),
        FollowUp.countDocuments({ status: 'pending' }),
        PurchaseOrder.countDocuments({ dispatchStatus: 'pending' }),
        Quotation.find().populate('clientId', 'companyName').sort({ createdAt: -1 }).limit(5).lean(),
        Visit.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        Invoice.aggregate([
          { $match: { invoiceDate: { $gte: moment().subtract(6, 'months').toDate() } } },
          { $group: { _id: { month: { $month: '$invoiceDate' }, year: { $year: '$invoiceDate' } }, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
          { $sort: { '_id.year': 1, '_id.month': 1 } }
        ])
      ]);

      apiResponse(res, 200, true, 'Dashboard data', {
        overview: { totalClients, activeContracts, amcCount, cmcCount, expiringContracts, pendingVisits, quotationsThisMonth, invoicesThisMonth, pendingFollowups, pendingPOs },
        charts: { visitsByStatus, monthlyRevenue },
        recentQuotations
      });
    } catch (err) { apiResponse(res, 500, false, err.message); }
  }
};

// ─── SETTINGS CONTROLLER ──────────────────────────────────────────────────────
exports.settingsController = {
  get: async (req, res) => {
    try {
      let settings = await Settings.findOne();
      if (!settings) settings = await Settings.create({});
      apiResponse(res, 200, true, 'Settings fetched', settings);
    } catch (err) { apiResponse(res, 500, false, err.message); }
  },

  update: async (req, res) => {
    try {
      let settings = await Settings.findOne();
      if (!settings) settings = new Settings();
      Object.assign(settings, req.body);
      await settings.save();
      apiResponse(res, 200, true, 'Settings updated', settings);
    } catch (err) { apiResponse(res, 500, false, err.message); }
  },

  uploadLogo: async (req, res) => {
    try {
      if (!req.file) return apiResponse(res, 400, false, 'No file uploaded');
      const logoPath = `/uploads/logos/${req.file.filename}`;
      await Settings.findOneAndUpdate({}, { logoPath }, { upsert: true });
      apiResponse(res, 200, true, 'Logo uploaded', { logoPath });
    } catch (err) { apiResponse(res, 500, false, err.message); }
  }
};

// ─── USER CONTROLLER ──────────────────────────────────────────────────────────
exports.userController = {
  getAll: async (req, res) => {
    try {
      const users = await User.find().sort({ createdAt: -1 }).lean();
      apiResponse(res, 200, true, 'Users fetched', users);
    } catch (err) { apiResponse(res, 500, false, err.message); }
  },

  update: async (req, res) => {
    try {
      const { password, ...rest } = req.body;
      const user = await User.findByIdAndUpdate(req.params.id, rest, { new: true });
      if (!user) return apiResponse(res, 404, false, 'User not found');
      apiResponse(res, 200, true, 'User updated', user);
    } catch (err) { apiResponse(res, 500, false, err.message); }
  },

  deactivate: async (req, res) => {
    try {
      await User.findByIdAndUpdate(req.params.id, { isActive: false });
      apiResponse(res, 200, true, 'User deactivated');
    } catch (err) { apiResponse(res, 500, false, err.message); }
  }
};
