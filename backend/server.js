require('dotenv').config();

const app = require('./app');
const reminderService = require('./services/reminder.service');

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\nArc Analytical ERP Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`API: http://localhost:${PORT}/api/health\n`);
});

// Start cron jobs for reminders (only for long-running server)
reminderService.startCronJobs();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err.message);
  server.close(() => process.exit(1));
});
