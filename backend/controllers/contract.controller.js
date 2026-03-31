const { Contract, Client } = require('../models');
const { apiResponse, getPagination, getPaginationMeta, generateContractNo } = require('../utils/helpers');
const moment = require('moment');

// GET /api/contracts
exports.getContracts = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { clientId, contractType, status, expiringSoon } = req.query;

    const filter = {};
    if (clientId) filter.clientId = clientId;
    if (contractType) filter.contractType = contractType;
    if (status) filter.status = status;
    if (expiringSoon === 'true') {
      filter.endDate = { $lte: moment().add(30, 'days').toDate(), $gte: new Date() };
      filter.status = 'active';
    }

    const [contracts, total] = await Promise.all([
      Contract.find(filter)
        .populate('clientId', 'companyName contactPerson phone city')
        .sort({ endDate: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Contract.countDocuments(filter)
    ]);

    // Add days remaining
    const enriched = contracts.map(c => ({
      ...c,
      daysRemaining: moment(c.endDate).diff(moment(), 'days'),
      isExpiringSoon: moment(c.endDate).diff(moment(), 'days') <= 30
    }));

    apiResponse(res, 200, true, 'Contracts fetched', enriched, getPaginationMeta(total, page, limit));
  } catch (err) {
    apiResponse(res, 500, false, err.message);
  }
};

// GET /api/contracts/:id
exports.getContract = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate('clientId', 'companyName contactPerson phone email address city')
      .populate('createdBy', 'name email')
      .lean();
    if (!contract) return apiResponse(res, 404, false, 'Contract not found');
    apiResponse(res, 200, true, 'Contract fetched', contract);
  } catch (err) {
    apiResponse(res, 500, false, err.message);
  }
};

// POST /api/contracts
exports.createContract = async (req, res) => {
  try {
    const contractNo = await generateContractNo();
    const contract = await Contract.create({ ...req.body, contractNo, createdBy: req.user._id });
    await contract.populate('clientId', 'companyName');
    apiResponse(res, 201, true, 'Contract created', contract);
  } catch (err) {
    apiResponse(res, 500, false, err.message);
  }
};

// PUT /api/contracts/:id
exports.updateContract = async (req, res) => {
  try {
    const contract = await Contract.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('clientId', 'companyName contactPerson');
    if (!contract) return apiResponse(res, 404, false, 'Contract not found');
    apiResponse(res, 200, true, 'Contract updated', contract);
  } catch (err) {
    apiResponse(res, 500, false, err.message);
  }
};

// DELETE /api/contracts/:id
exports.deleteContract = async (req, res) => {
  try {
    await Contract.findByIdAndUpdate(req.params.id, { status: 'cancelled' });
    apiResponse(res, 200, true, 'Contract cancelled');
  } catch (err) {
    apiResponse(res, 500, false, err.message);
  }
};

// GET /api/contracts/expiring - contracts expiring in next 30 days
exports.getExpiringContracts = async (req, res) => {
  try {
    const contracts = await Contract.find({
      status: 'active',
      endDate: { $lte: moment().add(30, 'days').toDate(), $gte: new Date() }
    }).populate('clientId', 'companyName contactPerson phone email').lean();

    apiResponse(res, 200, true, 'Expiring contracts', contracts);
  } catch (err) {
    apiResponse(res, 500, false, err.message);
  }
};
