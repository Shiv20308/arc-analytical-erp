const cron = require('node-cron');
const { Contract, FollowUp, Settings } = require('../models');
const emailService = require('./email.service');
const moment = require('moment');

const checkContractExpiry = async () => {
  try {
    const settings = await Settings.findOne().lean();
    // 30-day reminder
    const in30days = await Contract.find({
      status: 'active',
      reminderSent30: false,
      endDate: { $lte: moment().add(30,'days').toDate(), $gte: moment().add(29,'days').toDate() }
    }).populate('clientId','companyName contactPerson email phone');

    for (const contract of in30days) {
      try {
        await emailService.sendContractExpiryReminder(contract, settings);
        await Contract.findByIdAndUpdate(contract._id, { reminderSent30: true });
        console.log(`30-day reminder sent for contract ${contract.contractNo}`);
      } catch (e) { console.error('Reminder email error:', e.message); }
    }

    // 7-day reminder
    const in7days = await Contract.find({
      status: 'active',
      reminderSent7: false,
      endDate: { $lte: moment().add(7,'days').toDate(), $gte: moment().add(6,'days').toDate() }
    }).populate('clientId','companyName contactPerson email phone');

    for (const contract of in7days) {
      try {
        await emailService.sendContractExpiryReminder(contract, settings);
        await Contract.findByIdAndUpdate(contract._id, { reminderSent7: true });
        console.log(`7-day reminder sent for contract ${contract.contractNo}`);
      } catch (e) { console.error('Reminder email error:', e.message); }
    }

    // Mark expired contracts
    await Contract.updateMany(
      { status: 'active', endDate: { $lt: new Date() } },
      { status: 'expired' }
    );
  } catch (err) {
    console.error('Contract expiry check error:', err.message);
  }
};

const startCronJobs = () => {
  // Run daily at 9 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('Running daily contract expiry check...');
    await checkContractExpiry();
  });

  console.log('✅ Cron jobs started (daily contract expiry check at 9 AM)');
};

module.exports = { startCronJobs, checkContractExpiry };
