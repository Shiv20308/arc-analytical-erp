const { Settings, Quotation, Invoice, Contract } = require('../models');

// Generate sequential numbers with prefix
const generateNo = async (prefix, Model, field) => {
  const last = await Model.findOne({}).sort({ createdAt: -1 }).select(field);
  if (!last || !last[field]) return `${prefix}-0001`;
  const parts = last[field].split('-');
  const num = parseInt(parts[parts.length - 1]) + 1;
  return `${prefix}-${String(num).padStart(4, '0')}`;
};

const generateQuotationNo = async () => {
  const settings = await Settings.findOne();
  const prefix = settings?.quotationPrefix || 'QT';
  return generateNo(prefix, Quotation, 'quotationNo');
};

const generateInvoiceNo = async () => {
  const settings = await Settings.findOne();
  const prefix = settings?.invoicePrefix || 'INV';
  return generateNo(prefix, Invoice, 'invoiceNo');
};

const generateContractNo = async () => {
  const settings = await Settings.findOne();
  const prefix = settings?.contractPrefix || 'CON';
  return generateNo(prefix, Contract, 'contractNo');
};

// Standard API response
const apiResponse = (res, statusCode, success, message, data = null, meta = null) => {
  const response = { success, message };
  if (data !== null) response.data = data;
  if (meta !== null) response.meta = meta;
  return res.status(statusCode).json(response);
};

// Pagination helper
const getPagination = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const getPaginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  pages: Math.ceil(total / limit),
  hasNext: page < Math.ceil(total / limit),
  hasPrev: page > 1
});

module.exports = { generateQuotationNo, generateInvoiceNo, generateContractNo, apiResponse, getPagination, getPaginationMeta };
