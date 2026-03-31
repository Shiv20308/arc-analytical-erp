const nodemailer = require('nodemailer');

const createTransporter = () => nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_PORT == 465,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  tls: { rejectUnauthorized: false }
});

const sendQuotationEmail = async (quotation, pdfPath, settings) => {
  const transporter = createTransporter();
  const clientEmail = quotation.clientId?.email;
  if (!clientEmail) throw new Error('Client email not found');
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: clientEmail,
    subject: `Quotation ${quotation.quotationNo} from ${settings?.companyName || 'Arc Analytical'}`,
    html: `<p>Dear ${quotation.clientId?.contactPerson},</p><p>Please find attached quotation <b>${quotation.quotationNo}</b> for ₹${quotation.totalAmount?.toLocaleString('en-IN')}.</p><p>Regards,<br>${settings?.companyName || 'Arc Analytical'}</p>`,
    attachments: pdfPath ? [{ filename: `Quotation-${quotation.quotationNo}.pdf`, path: pdfPath }] : []
  });
};

const sendInvoiceEmail = async (invoice, pdfPath, settings) => {
  const transporter = createTransporter();
  const clientEmail = invoice.clientId?.email;
  if (!clientEmail) throw new Error('Client email not found');
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: clientEmail,
    subject: `Invoice ${invoice.invoiceNo} from ${settings?.companyName || 'Arc Analytical'}`,
    html: `<p>Dear ${invoice.clientId?.contactPerson},</p><p>Please find attached invoice <b>${invoice.invoiceNo}</b> for ₹${invoice.totalAmount?.toLocaleString('en-IN')}.</p><p>Regards,<br>${settings?.companyName || 'Arc Analytical'}</p>`,
    attachments: pdfPath ? [{ filename: `Invoice-${invoice.invoiceNo}.pdf`, path: pdfPath }] : []
  });
};

const sendContractExpiryReminder = async (contract, settings) => {
  const transporter = createTransporter();
  const clientEmail = contract.clientId?.email;
  if (!clientEmail) return;
  const daysLeft = Math.ceil((new Date(contract.endDate) - new Date()) / (1000*60*60*24));
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: clientEmail,
    subject: `${contract.contractType} Contract Expiry in ${daysLeft} days - ${contract.contractNo}`,
    html: `<p>Dear ${contract.clientId?.contactPerson},</p><p>Your ${contract.contractType} contract <b>${contract.contractNo}</b> expires in <b>${daysLeft} days</b> on ${new Date(contract.endDate).toLocaleDateString('en-IN')}.</p><p>Please contact us to renew.</p><p>Regards,<br>${settings?.companyName || 'Arc Analytical'}</p>`
  });
};

module.exports = { sendQuotationEmail, sendInvoiceEmail, sendContractExpiryReminder };
