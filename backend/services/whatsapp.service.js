// WhatsApp Integration Placeholder (Twilio API)
// Install: npm install twilio
// Uncomment and configure to enable

const sendWhatsAppMessage = async (to, message) => {
  // const twilio = require('twilio');
  // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  // const phone = to.startsWith('+') ? to : `+91${to}`;
  // await client.messages.create({
  //   body: message,
  //   from: process.env.TWILIO_WHATSAPP_FROM,
  //   to: `whatsapp:${phone}`
  // });
  console.log(`[WhatsApp Placeholder] To: ${to} | Message: ${message}`);
};

const sendQuotationWhatsApp = async (quotation) => {
  const phone = quotation.clientId?.phone;
  if (!phone) return;
  const message = `Dear ${quotation.clientId?.contactPerson},\n\nPlease find your quotation *${quotation.quotationNo}* for ₹${quotation.totalAmount?.toLocaleString('en-IN')}.\n\nRegards,\nArc Analytical`;
  await sendWhatsAppMessage(phone, message);
};

module.exports = { sendWhatsAppMessage, sendQuotationWhatsApp };
