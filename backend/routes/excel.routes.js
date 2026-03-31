const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const ExcelJS = require('exceljs');
const { Client, Contract, Visit, Quotation } = require('../models');
const { apiResponse } = require('../utils/helpers');

router.use(protect);

// Export clients to Excel
router.get('/export/clients', async (req, res) => {
  try {
    const clients = await Client.find({ isActive: true }).lean();
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Clients');
    sheet.columns = [
      { header: 'Company Name', key: 'companyName', width: 30 },
      { header: 'Contact Person', key: 'contactPerson', width: 20 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'City', key: 'city', width: 15 },
      { header: 'State', key: 'state', width: 15 },
      { header: 'GST', key: 'gst', width: 20 },
    ];
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    clients.forEach(c => sheet.addRow(c));
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=clients.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) { apiResponse(res, 500, false, err.message); }
});

// Export contracts to Excel
router.get('/export/contracts', async (req, res) => {
  try {
    const contracts = await Contract.find().populate('clientId', 'companyName').lean();
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Contracts');
    sheet.columns = [
      { header: 'Contract No', key: 'contractNo', width: 15 },
      { header: 'Client', key: 'client', width: 30 },
      { header: 'Type', key: 'contractType', width: 10 },
      { header: 'Instrument', key: 'instrumentType', width: 20 },
      { header: 'Start Date', key: 'startDate', width: 15 },
      { header: 'End Date', key: 'endDate', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Value', key: 'value', width: 15 },
    ];
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
    contracts.forEach(c => sheet.addRow({
      ...c,
      client: c.clientId?.companyName || '',
      startDate: c.startDate ? new Date(c.startDate).toLocaleDateString('en-IN') : '',
      endDate: c.endDate ? new Date(c.endDate).toLocaleDateString('en-IN') : ''
    }));
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=contracts.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) { apiResponse(res, 500, false, err.message); }
});

// Import clients from Excel
router.post('/import/clients', upload.single('excel'), async (req, res) => {
  try {
    if (!req.file) return apiResponse(res, 400, false, 'No file uploaded');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    const sheet = workbook.getWorksheet(1);
    const clients = [];
    const headers = [];
    sheet.getRow(1).eachCell(cell => headers.push(cell.value?.toString().toLowerCase().replace(/\s+/g, '')));
    sheet.eachRow((row, rowNum) => {
      if (rowNum === 1) return;
      const obj = {};
      row.eachCell((cell, colNum) => { obj[headers[colNum-1]] = cell.value?.toString() || ''; });
      if (obj.companyname || obj['companyname']) clients.push({
        companyName: obj.companyname || obj['company name'] || '',
        contactPerson: obj.contactperson || obj['contact person'] || '',
        phone: obj.phone || '',
        email: obj.email || '',
        city: obj.city || '',
        state: obj.state || '',
        gst: obj.gst || '',
        address: obj.address || '',
        createdBy: req.user._id
      });
    });
    const result = await Client.insertMany(clients, { ordered: false });
    apiResponse(res, 200, true, `${result.length} clients imported successfully`);
  } catch (err) { apiResponse(res, 500, false, err.message); }
});

module.exports = router;
