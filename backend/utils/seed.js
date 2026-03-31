require('dotenv').config();
const mongoose = require('mongoose');
const { User, Client, Contract, Settings } = require('../models');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([User.deleteMany(), Client.deleteMany(), Contract.deleteMany(), Settings.deleteMany()]);

  // Create settings
  await Settings.create({
    companyName: 'Arc Analytical',
    tagline: 'Analytical Instruments & Services',
    address: '123, Industrial Area, Phase 2',
    city: 'Chandigarh',
    state: 'Punjab',
    pincode: '160002',
    phone: '+91-98765-43210',
    email: 'info@arcanalytical.com',
    website: 'www.arcanalytical.com',
    gst: '03AABCA1234Z1Z5',
    pan: 'AABCA1234Z',
    bankName: 'HDFC Bank',
    accountNo: '50200012345678',
    ifsc: 'HDFC0001234',
    accountHolder: 'Arc Analytical',
    swiftCode: 'INDBINBBCHS',
    ieCode: 'GEGPS4510P',
    quotationPrefix: 'QT',
    invoicePrefix: 'INV',
    contractPrefix: 'CON',
    quotationTerms: '1. Prices are exclusive of GST unless mentioned.\n2. Delivery within 4-6 weeks from order confirmation.\n3. Payment: 50% advance, 50% before delivery.\n4. Warranty: 12 months from installation.',
  });

  // Create users
  const admin = await User.create({ name: 'Admin User', email: 'admin@arcanalytical.com', password: 'admin123', role: 'admin', phone: '9876543210' });
  const engineer = await User.create({ name: 'Rajesh Kumar', email: 'rajesh@arcanalytical.com', password: 'engineer123', role: 'engineer', phone: '9876543211' });
  const sales = await User.create({ name: 'Priya Sharma', email: 'priya@arcanalytical.com', password: 'sales123', role: 'sales', phone: '9876543212' });

  // Create clients
  const clients = await Client.insertMany([
    { companyName: 'PharmaCo Labs Pvt Ltd', contactPerson: 'Dr. Arun Mehta', phone: '9876543001', email: 'arun@pharmacolabs.com', address: 'Plot 45, Pharma SEZ', city: 'Hyderabad', state: 'Telangana', gst: '36AABCP1234Z1Z1', createdBy: admin._id },
    { companyName: 'BioTech Research Institute', contactPerson: 'Dr. Sneha Patel', phone: '9876543002', email: 'sneha@biotechi.com', address: '12, Science City Road', city: 'Ahmedabad', state: 'Gujarat', gst: '24AABCB5678Z1Z2', createdBy: admin._id },
    { companyName: 'National Testing Laboratory', contactPerson: 'Mr. Vikram Singh', phone: '9876543003', email: 'vikram@ntl.gov.in', address: 'Government Complex, Block A', city: 'New Delhi', state: 'Delhi', createdBy: admin._id },
    { companyName: 'Apex Chemicals Ltd', contactPerson: 'Mrs. Anita Reddy', phone: '9876543004', email: 'anita@apexchem.com', address: '78, Chemical Industrial Zone', city: 'Pune', state: 'Maharashtra', gst: '27AABCA9012Z1Z3', createdBy: sales._id },
    { companyName: 'University of Science & Tech', contactPerson: 'Prof. Suresh Nair', phone: '9876543005', email: 'suresh@ust.edu.in', address: 'University Campus, Main Building', city: 'Kochi', state: 'Kerala', createdBy: sales._id },
  ]);

  // Create contracts
  const now = new Date();
  await Contract.insertMany([
    { clientId: clients[0]._id, contractType: 'AMC', contractNo: 'CON-0001', instrumentType: 'HPLC', instrumentModel: 'Agilent 1260', startDate: new Date(now.getFullYear(), now.getMonth()-6, 1), endDate: new Date(now.getFullYear(), now.getMonth()+6, 1), pmVisitsPerYear: 2, includesBreakdown: true, includesParts: false, value: 85000, status: 'active', createdBy: admin._id },
    { clientId: clients[1]._id, contractType: 'CMC', contractNo: 'CON-0002', instrumentType: 'GC', instrumentModel: 'Shimadzu GC-2010', startDate: new Date(now.getFullYear(), now.getMonth()-2, 1), endDate: new Date(now.getFullYear(), now.getMonth()+22, 1), pmVisitsPerYear: 4, includesBreakdown: true, includesParts: true, value: 125000, status: 'active', createdBy: admin._id },
    { clientId: clients[2]._id, contractType: 'AMC', contractNo: 'CON-0003', instrumentType: 'UV-Vis Spectrophotometer', instrumentModel: 'Perkin Elmer Lambda 35', startDate: new Date(now.getFullYear(), now.getMonth()-11, 1), endDate: new Date(now.getFullYear(), now.getMonth()+1, 1), pmVisitsPerYear: 2, includesBreakdown: false, value: 45000, status: 'active', createdBy: admin._id },
    { clientId: clients[3]._id, contractType: 'AMC', contractNo: 'CON-0004', instrumentType: 'Karl Fischer Titrator', instrumentModel: 'Metrohm 870', startDate: new Date(now.getFullYear()-1, now.getMonth(), 1), endDate: new Date(now.getFullYear(), now.getMonth()-1, 1), value: 38000, status: 'expired', createdBy: sales._id },
  ]);

  console.log('\n✅ Seed data created successfully!');
  console.log('\nLogin credentials:');
  console.log('Admin:    admin@arcanalytical.com  / admin123');
  console.log('Engineer: rajesh@arcanalytical.com / engineer123');
  console.log('Sales:    priya@arcanalytical.com  / sales123\n');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
