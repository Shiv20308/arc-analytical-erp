const { Client, Contract, Quotation } = require('../models');
const { apiResponse, getPagination, getPaginationMeta } = require('../utils/helpers');

// GET /api/clients
exports.getClients = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { search, city, state, isActive } = req.query;

    const filter = {};
    if (search) filter.$text = { $search: search };
    if (city) filter.city = new RegExp(city, 'i');
    if (state) filter.state = new RegExp(state, 'i');
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const [clients, total] = await Promise.all([
      Client.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Client.countDocuments(filter)
    ]);

    apiResponse(res, 200, true, 'Clients fetched', clients, getPaginationMeta(total, page, limit));
  } catch (err) {
    apiResponse(res, 500, false, err.message);
  }
};

// GET /api/clients/:id
exports.getClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).lean();
    if (!client) return apiResponse(res, 404, false, 'Client not found');

    const [contracts, quotations] = await Promise.all([
      Contract.find({ clientId: client._id }).lean(),
      Quotation.find({ clientId: client._id }).sort({ createdAt: -1 }).limit(5).lean()
    ]);

    apiResponse(res, 200, true, 'Client fetched', { ...client, contracts, recentQuotations: quotations });
  } catch (err) {
    apiResponse(res, 500, false, err.message);
  }
};

// POST /api/clients
exports.createClient = async (req, res) => {
  try {
    const client = await Client.create({ ...req.body, createdBy: req.user._id });
    apiResponse(res, 201, true, 'Client created', client);
  } catch (err) {
    if (err.code === 11000) return apiResponse(res, 400, false, 'Client already exists');
    apiResponse(res, 500, false, err.message);
  }
};

// PUT /api/clients/:id
exports.updateClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!client) return apiResponse(res, 404, false, 'Client not found');
    apiResponse(res, 200, true, 'Client updated', client);
  } catch (err) {
    apiResponse(res, 500, false, err.message);
  }
};

// DELETE /api/clients/:id
exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!client) return apiResponse(res, 404, false, 'Client not found');
    apiResponse(res, 200, true, 'Client deactivated');
  } catch (err) {
    apiResponse(res, 500, false, err.message);
  }
};

// GET /api/clients/all (for dropdowns - no pagination)
exports.getAllClientsSimple = async (req, res) => {
  try {
    const clients = await Client.find({ isActive: true }).select('companyName contactPerson phone email').sort('companyName').lean();
    apiResponse(res, 200, true, 'Clients list', clients);
  } catch (err) {
    apiResponse(res, 500, false, err.message);
  }
};
