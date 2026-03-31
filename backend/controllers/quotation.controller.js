const path = require('path');
const fs = require('fs');
const { Quotation, Client, Settings } = require('../models');
const { apiResponse, getPagination, getPaginationMeta, generateQuotationNo } = require('../utils/helpers');
const pdfService = require('../services/pdf.service');
const emailService = require('../services/email.service');

// GET /api/quotations
exports.getQuotations = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { clientId, status, search } = req.query;

    const filter = {};
    if (clientId) filter.clientId = clientId;
    if (status) filter.status = status;
    if (search) filter.quotationNo = new RegExp(search, 'i');

    const [quotations, total] = await Promise.all([
      Quotation.find(filter)
        .populate('clientId', 'companyName contactPerson city')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Quotation.countDocuments(filter)
    ]);

    apiResponse(res, 200, true, 'Quotations fetched', quotations, getPaginationMeta(total, page, limit));
  } catch (err) {
    apiResponse(res, 500, false, err.message);
  }
};

// GET /api/quotations/:id
exports.getQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('clientId')
      .populate('createdBy', 'name email')
      .lean();
    if (!quotation) return apiResponse(res, 404, false, 'Quotation not found');
    apiResponse(res, 200, true, 'Quotation fetched', quotation);
  } catch (err) {
    apiResponse(res, 500, false, err.message);
  }
};

// POST /api/quotations
exports.createQuotation = async (req, res) => {
  try {
    const quotationNo = await generateQuotationNo();
    const { items, gstPercent = 18 } = req.body;

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const gstAmount = (subtotal * gstPercent) / 100;
    const totalAmount = subtotal + gstAmount;

    const quotation = await Quotation.create({
      ...req.body,
      quotationNo,
      subtotal,
      gstAmount,
      totalAmount,
      createdBy: req.user._id
    });

    await quotation.populate('clientId', 'companyName contactPerson');
    apiResponse(res, 201, true, 'Quotation created', quotation);
  } catch (err) {
    apiResponse(res, 500, false, err.message);
  }
};

// PUT /api/quotations/:id
exports.updateQuotation = async (req, res) => {
  try {
    const { items, gstPercent = 18 } = req.body;
    if (items) {
      req.body.subtotal = items.reduce((sum, item) => sum + item.amount, 0);
      req.body.gstAmount = (req.body.subtotal * gstPercent) / 100;
      req.body.totalAmount = req.body.subtotal + req.body.gstAmount;
    }

    const quotation = await Quotation.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('clientId', 'companyName contactPerson');
    if (!quotation) return apiResponse(res, 404, false, 'Quotation not found');
    apiResponse(res, 200, true, 'Quotation updated', quotation);
  } catch (err) {
    apiResponse(res, 500, false, err.message);
  }
};

// POST /api/quotations/:id/generate-pdf
exports.generatePDF = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('clientId')
      .lean();
    if (!quotation) return apiResponse(res, 404, false, 'Quotation not found');

    const settings = await Settings.findOne().lean();
    const pdfPath = await pdfService.generateQuotationPDF(quotation, settings);

    const filename = path.basename(pdfPath);
    await Quotation.findByIdAndUpdate(req.params.id, { pdfPath });
    apiResponse(res, 200, true, 'PDF generated', { pdfPath, filename, downloadUrl: `/uploads/pdfs/${filename}` });
  } catch (err) {
    apiResponse(res, 500, false, err.message);
  }
};

// POST /api/quotations/:id/send-email
exports.sendEmail = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id).populate('clientId').lean();
    if (!quotation) return apiResponse(res, 404, false, 'Quotation not found');

    const settings = await Settings.findOne().lean();

    // Generate PDF if not exists
    let pdfPath = quotation.pdfPath;
    if (!pdfPath || !fs.existsSync(pdfPath)) {
      pdfPath = await pdfService.generateQuotationPDF(quotation, settings);
      await Quotation.findByIdAndUpdate(req.params.id, { pdfPath, status: 'sent', sentAt: new Date() });
    }

    await emailService.sendQuotationEmail(quotation, pdfPath, settings);
    await Quotation.findByIdAndUpdate(req.params.id, { status: 'sent', sentAt: new Date() });

    apiResponse(res, 200, true, 'Quotation sent via email');
  } catch (err) {
    apiResponse(res, 500, false, err.message);
  }
};

// DELETE /api/quotations/:id
exports.deleteQuotation = async (req, res) => {
  try {
    await Quotation.findByIdAndDelete(req.params.id);
    apiResponse(res, 200, true, 'Quotation deleted');
  } catch (err) {
    apiResponse(res, 500, false, err.message);
  }
};
