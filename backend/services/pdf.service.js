const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const moment = require('moment');

const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };

const formatINR = (amount) => {
  const n = parseFloat(amount) || 0;
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const numberToWords = (num) => {
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  num = Math.round(num);
  if (num === 0) return 'Zero';
  if (num < 20) return ones[num];
  if (num < 100) return tens[Math.floor(num/10)] + (num%10 ? ' '+ones[num%10] : '');
  if (num < 1000) return ones[Math.floor(num/100)] + ' Hundred' + (num%100 ? ' '+numberToWords(num%100) : '');
  if (num < 100000) return numberToWords(Math.floor(num/1000)) + ' Thousand' + (num%1000 ? ' '+numberToWords(num%1000) : '');
  if (num < 10000000) return numberToWords(Math.floor(num/100000)) + ' Lakh' + (num%100000 ? ' '+numberToWords(num%100000) : '');
  return numberToWords(Math.floor(num/10000000)) + ' Crore' + (num%10000000 ? ' '+numberToWords(num%10000000) : '');
};

// ─── ARC ANALYTICALS LOGO SVG (used in both templates) ───────────────────────
const arcLogo = `<svg width="70" height="70" viewBox="0 0 70 70" xmlns="http://www.w3.org/2000/svg">
  <rect width="70" height="70" fill="#5a1a0a" rx="4"/>
  <text x="35" y="30" font-family="Arial Black,Arial" font-weight="900" font-size="22" fill="white" text-anchor="middle">ARC</text>
  <text x="35" y="50" font-family="Arial" font-size="8" fill="#d4a06a" text-anchor="middle" letter-spacing="1">ANALYTICAL</text>
</svg>`;

// ─── INVOICE PDF (exact match to Micro Organics invoice format) ───────────────
const generateInvoicePDF = async (invoice, settings) => {
  const outputDir = path.join(__dirname, '../uploads/pdfs');
  ensureDir(outputDir);
  const filename = `invoice-${invoice.invoiceNo}-${Date.now()}.pdf`;
  const outputPath = path.join(outputDir, filename);

  const s = settings || {};
  const client = invoice.clientId || {};
  const items = invoice.items || [];

  // Calculate tax
  const subtotal = invoice.subtotal || items.reduce((sum,i) => sum + (i.amount||0), 0);
  const gstPct = invoice.gstPercent || 18;
  const isSameState = invoice.taxType === 'intra'; // CGST+SGST vs IGST
  const cgst = isSameState ? (subtotal * gstPct / 2 / 100) : 0;
  const sgst = isSameState ? (subtotal * gstPct / 2 / 100) : 0;
  const igst = !isSameState ? (subtotal * gstPct / 100) : 0;
  const grandTotal = subtotal + cgst + sgst + igst;

  const itemsHTML = items.map((item, i) => `
    <tr>
      <td style="text-align:center;border:1px solid #000;padding:5px 4px">${i+1}</td>
      <td style="border:1px solid #000;padding:5px 8px;font-weight:600">${item.description}</td>
      <td style="border:1px solid #000;padding:5px 4px;text-align:center">${item.hsnCode || '90279090'}</td>
      <td style="border:1px solid #000;padding:5px 4px;text-align:center">${item.modelNo || item.unit || '-'}</td>
      <td style="border:1px solid #000;padding:5px 4px;text-align:center">${item.quantity}</td>
      <td style="border:1px solid #000;padding:5px 8px;text-align:right">${formatINR(item.unitPrice)}</td>
      <td style="border:1px solid #000;padding:5px 8px;text-align:right;font-weight:600">${formatINR(item.amount)}</td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #000; padding: 24px; background: #fff; }
  .outer-border { border: 2px solid #000; padding: 0; }
  .header { display: flex; align-items: flex-start; gap: 16px; padding: 14px 16px 10px; border-bottom: 2px solid #000; }
  .company-name { font-size: 22px; font-weight: 900; letter-spacing: 1px; color: #000; }
  .company-sub { font-size: 10.5px; margin-top: 3px; color: #222; line-height: 1.6; }
  .invoice-title { text-align: center; font-size: 18px; font-weight: 700; letter-spacing: 4px; padding: 6px; border-bottom: 1px solid #000; background: #f5f5f5; }
  .bill-row { display: flex; border-bottom: 1px solid #000; }
  .bill-left { flex: 1; padding: 10px 14px; border-right: 1px solid #000; }
  .bill-right { width: 260px; padding: 10px 14px; }
  .bill-right table { width: 100%; border-collapse: collapse; }
  .bill-right td { padding: 3px 0; font-size: 11.5px; }
  .bill-right td:first-child { color: #444; font-weight: 600; }
  .bill-right td:last-child { font-weight: 700; text-align: right; }
  .items-table { width: 100%; border-collapse: collapse; }
  .items-table th { background: #f0f0f0; border: 1px solid #000; padding: 7px 6px; font-size: 11px; text-align: center; font-weight: 700; }
  .bank-totals { display: flex; border-top: 1px solid #000; }
  .bank-section { flex: 1; padding: 10px 14px; border-right: 1px solid #000; }
  .bank-section p { font-size: 11px; margin-bottom: 3px; }
  .totals-section { width: 260px; padding: 6px 14px; }
  .totals-section table { width: 100%; border-collapse: collapse; }
  .totals-section td { padding: 4px 2px; font-size: 12px; border-bottom: 0.5px solid #eee; }
  .totals-section .grand td { font-size: 14px; font-weight: 900; border-top: 2px solid #000; padding-top: 6px; }
  .terms { padding: 10px 14px; border-top: 1px solid #000; font-size: 10.5px; line-height: 1.7; }
  .terms p { margin-bottom: 2px; }
  .sign-row { display: flex; justify-content: space-between; padding: 14px 16px 10px; border-top: 1px solid #000; }
  .words-row { padding: 6px 14px; background: #fafafa; border-top: 0.5px solid #ddd; font-size: 11px; }
</style>
</head>
<body>
<div class="outer-border">

  <!-- HEADER -->
  <div class="header">
    <div>${arcLogo}</div>
    <div>
      <div class="company-name">${s.companyName || 'ARC ANALYTICALS'}</div>
      <div class="company-sub">
        Address- ${s.address || 'Village Badisher PO, Koti Morni'}, ${s.city || 'Panchkula'}, ${s.state || 'Haryana'}-${s.pincode || '134205'}<br>
        Phone Nos. ${s.phone || '+91 9896155909'}, e-mail- ${s.email || 'Arcanalyticals@gmail.com'}<br>
        GST- ${s.gst || '06GEGPS4510P1ZZ'}
      </div>
    </div>
  </div>

  <!-- INVOICE TITLE -->
  <div class="invoice-title">INVOICE</div>

  <!-- BILL TO + INVOICE META -->
  <div class="bill-row">
    <div class="bill-left">
      <div style="font-weight:700;margin-bottom:6px">Company Name:</div>
      <div style="font-weight:600;font-size:13px">${client.companyName || ''}</div>
      <div style="margin-top:4px;font-size:11.5px;color:#333">${client.address || ''}</div>
      ${client.city ? `<div style="font-size:11.5px;color:#333">${client.city}${client.state ? ', '+client.state : ''}</div>` : ''}
      ${client.email ? `<div style="font-size:11.5px;margin-top:4px">E MAIL – ${client.email}</div>` : ''}
      ${client.phone ? `<div style="font-size:11.5px">Contact No. ${client.phone}</div>` : ''}
      ${client.gst ? `<div style="font-size:11.5px;font-weight:700;margin-top:4px">GSTIN:- ${client.gst}</div>` : ''}
    </div>
    <div class="bill-right">
      <table>
        <tr><td>Invoice No.</td><td>${invoice.invoiceNo}</td></tr>
        <tr><td>Date</td><td>${moment(invoice.invoiceDate || new Date()).format('DD-MM-YYYY')}</td></tr>
        <tr><td>PO NO.</td><td>${invoice.poNumber || 'NA'}</td></tr>
        <tr><td>Bill for Month</td><td>${moment(invoice.invoiceDate || new Date()).format('MMM-YY')}</td></tr>
      </table>
    </div>
  </div>

  <!-- ITEMS TABLE -->
  <table class="items-table">
    <thead>
      <tr>
        <th style="width:40px">Sr. Nos.</th>
        <th>Particulars</th>
        <th style="width:90px">HSN Code</th>
        <th style="width:110px">MODEL NO</th>
        <th style="width:55px">Units</th>
        <th style="width:80px">Rate</th>
        <th style="width:90px">Value</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHTML}
      ${Array(Math.max(0, 4 - items.length)).fill('<tr><td style="border:1px solid #000;padding:14px 4px" colspan="1">&nbsp;</td><td style="border:1px solid #000;padding:14px 4px"></td><td style="border:1px solid #000;padding:14px 4px"></td><td style="border:1px solid #000;padding:14px 4px"></td><td style="border:1px solid #000;padding:14px 4px"></td><td style="border:1px solid #000;padding:14px 4px"></td><td style="border:1px solid #000;padding:14px 4px"></td></tr>').join('')}
    </tbody>
  </table>

  <!-- BANK + TOTALS -->
  <div class="bank-totals">
    <div class="bank-section">
      <p style="font-weight:700;margin-bottom:5px">Our Bank Details:-</p>
      <p>${s.companyName || 'Arc Analyticals'}</p>
      <p>${s.bankName || 'IndusInd Bank'}, ACCOUNT NO. – ${s.accountNo || '259896155909'}</p>
      <p>IFSC CODE – ${s.ifsc || 'INDB0000090'}</p>
      ${s.swiftCode ? `<p>SHIFT CODE: ${s.swiftCode}</p>` : '<p>SHIFT CODE: INDBINBBCHS</p>'}
      ${s.ieCode ? `<p>IE CODE: ${s.ieCode}</p>` : '<p>IE CODE: GEGPS4510P</p>'}
    </div>
    <div class="totals-section">
      <table>
        <tr><td>Total</td><td style="text-align:right">${formatINR(subtotal)}</td></tr>
        <tr><td>Taxable Value</td><td style="text-align:right">${formatINR(subtotal)}</td></tr>
        ${igst > 0 ? `<tr><td>IGST ${gstPct}%</td><td style="text-align:right">${formatINR(igst)}</td></tr>` : ''}
        ${cgst > 0 ? `<tr><td>CGST ${gstPct/2}%</td><td style="text-align:right">${formatINR(cgst)}</td></tr>` : ''}
        ${sgst > 0 ? `<tr><td>SGST ${gstPct/2}%</td><td style="text-align:right">${formatINR(sgst)}</td></tr>` : ''}
        <tr class="grand"><td><strong>Grand Total</strong></td><td style="text-align:right"><strong>${formatINR(grandTotal)}</strong></td></tr>
      </table>
    </div>
  </div>

  <!-- AMOUNT IN WORDS -->
  <div class="words-row">
    <strong>Amount in Words:</strong> ${numberToWords(Math.round(grandTotal))} Rupees Only
  </div>

  <!-- TERMS -->
  <div class="terms">
    <p style="font-weight:700;margin-bottom:4px">Terms &amp; Conditions:-</p>
    <p>&gt;All Disputes are subject to ${s.city || 'Panchkula'} Court</p>
    <p>&gt;Our responsibilities ceases with the delivery of services</p>
    <p>&gt;Interest @ 24% PA will be charged, if the bill is not paid in 15 days from the date of bill.</p>
    ${invoice.notes ? `<p>&gt;${invoice.notes}</p>` : ''}
  </div>

  <!-- SIGNATURE -->
  <div class="sign-row">
    <div></div>
    <div style="text-align:right">
      <div style="font-weight:700;font-size:12px">Lekh Singh</div>
      <div style="font-size:11px">(Authorised Signatory)</div>
    </div>
  </div>

</div>
</body>
</html>`;

  const browser = await puppeteer.launch({ headless:'new', args:['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil:'networkidle0' });
  await page.pdf({ path:outputPath, format:'A4', printBackground:true, margin:{top:'10mm',bottom:'10mm',left:'12mm',right:'12mm'} });
  await browser.close();
  return outputPath;
};

// ─── QUOTATION PDF (exact match to IVM quotation format) ──────────────────────
const generateQuotationPDF = async (quotation, settings) => {
  const outputDir = path.join(__dirname, '../uploads/pdfs');
  ensureDir(outputDir);
  const filename = `quotation-${quotation.quotationNo}-${Date.now()}.pdf`;
  const outputPath = path.join(outputDir, filename);

  const s = settings || {};
  const client = quotation.clientId || {};
  const items = quotation.items || [];

  const subtotal = quotation.subtotal || items.reduce((sum,i) => sum + (i.amount||0), 0);
  const gstPct = quotation.gstPercent || 18;
  const gstAmount = (subtotal * gstPct) / 100;
  const total = subtotal + gstAmount;

  // Build item rows (minimum 8 rows for the table)
  const itemRows = [...items];
  while (itemRows.length < 8) itemRows.push(null);

  const itemsHTML = itemRows.map((item, i) => {
    if (!item) return `
      <tr style="height:26px">
        <td style="border:1px solid #555;padding:3px 6px;text-align:center"></td>
        <td style="border:1px solid #555;padding:3px 6px"></td>
        <td style="border:1px solid #555;padding:3px 6px;text-align:center"></td>
        <td style="border:1px solid #555;padding:3px 6px;text-align:center"></td>
        <td style="border:1px solid #555;padding:3px 6px;text-align:right"></td>
        <td style="border:1px solid #555;padding:3px 6px;text-align:right"></td>
      </tr>`;
    return `
      <tr>
        <td style="border:1px solid #555;padding:5px 6px;text-align:center">${i+1}</td>
        <td style="border:1px solid #555;padding:5px 8px">${item.description}</td>
        <td style="border:1px solid #555;padding:5px 6px;text-align:center">${item.modelNo || item.unit || '-'}</td>
        <td style="border:1px solid #555;padding:5px 6px;text-align:center">${item.quantity}</td>
        <td style="border:1px solid #555;padding:5px 8px;text-align:right">${formatINR(item.unitPrice)}</td>
        <td style="border:1px solid #555;padding:5px 8px;text-align:right;font-weight:700">${formatINR(item.amount)}</td>
      </tr>`;
  }).join('');

  const termsHTML = (quotation.terms || s.quotationTerms || `1. Price for Destination\n2. PO to be released in favour of ARC Analyticals Office: Village Badisher PO Koti District Panchkula Haryana -134205.\n3. Payment: Advance 100%\n4. Freight at Actual.\n5. Under the AMC contract: Unlimited breakdown support and 1 preventive maintenance (PM) visit (excluding consumables) will be covered.\n6. Under the CMC contract: Unlimited breakdown support, spare parts (excluding consumables), and 1 PM visit (excluding lamp) will be covered.\n7. The instrument contract will commence from the date of the Performa invoice.\n8. Delivery period: 10–15 days.\n9. A one-year warranty will be covered under this order, followed by AMC in the next 1 year.`)
    .split('\n').map(line => line.trim()).filter(Boolean)
    .map(line => `<p style="margin-bottom:5px">${line}</p>`).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #000; background: #fff; }
  @page { size: A4; margin: 0; }
  
  /* Decorative wave shapes - top right */
  .page { position: relative; padding: 28px 28px 0; min-height: 297mm; overflow: hidden; }
  .deco-top { position: absolute; top: 0; right: 0; width: 180px; height: 160px; overflow: hidden; pointer-events: none; }
  .deco-bottom { position: absolute; bottom: 0; left: 0; width: 100%; height: 90px; overflow: hidden; pointer-events: none; }

  .header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 16px; }
  .company-name { font-size: 24px; font-weight: 900; color: #000; letter-spacing: 0.5px; }
  .company-sub { font-size: 10.5px; color: #333; line-height: 1.65; margin-top: 3px; }

  .to-section { margin-bottom: 12px; font-size: 11.5px; line-height: 1.8; }
  .to-section .to-label { font-size: 13px; font-weight: 700; }

  .meta-box { float: right; width: 280px; border: 1px solid #aaa; border-collapse: collapse; margin-left: 16px; margin-bottom: 10px; }
  .meta-box table { width: 100%; border-collapse: collapse; }
  .meta-box td { padding: 5px 8px; font-size: 11px; border-bottom: 0.5px solid #ccc; }
  .meta-box td:first-child { font-weight: 600; background: #f5f5f5; width: 100px; }
  .meta-box td:last-child { font-weight: 700; }
  .meta-box .bank-section td { font-size: 10.5px; }

  .subject { font-size: 13px; font-weight: 700; margin: 10px 0 6px; }
  .dear { font-size: 11.5px; margin-bottom: 8px; }
  .writing { font-size: 11.5px; margin-bottom: 10px; }

  .items-table { width: 100%; border-collapse: collapse; margin: 8px 0; }
  .items-table th { background: #2c1a0e; color: #fff; padding: 8px 6px; font-size: 11.5px; font-weight: 700; text-align: center; border: 1px solid #2c1a0e; }
  .items-table th.left { text-align: left; padding-left: 10px; }
  .items-table td { font-size: 11.5px; }
  .items-table tfoot td { background: #f5f5f5; font-weight: 700; border: 1px solid #555; padding: 6px 8px; }
  .items-table tfoot .total-row td { background: #2c1a0e; color: #fff; font-size: 14px; font-weight: 900; }

  .clearfix::after { content:''; display:table; clear:both; }
</style>
</head>
<body>
<div class="page">

  <!-- Decorative elements matching original brown wave design -->
  <div class="deco-top">
    <svg width="180" height="160" viewBox="0 0 180 160" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="160" cy="30" rx="80" ry="50" fill="#d4a06a" opacity="0.5" transform="rotate(-20 160 30)"/>
      <ellipse cx="175" cy="60" rx="70" ry="40" fill="#8b3a0f" opacity="0.7" transform="rotate(-10 175 60)"/>
      <ellipse cx="165" cy="100" rx="90" ry="35" fill="#5a1a0a" opacity="0.6" transform="rotate(5 165 100)"/>
      <ellipse cx="170" cy="140" rx="80" ry="30" fill="#3a0f05" opacity="0.5" transform="rotate(10 170 140)"/>
    </svg>
  </div>

  <!-- HEADER -->
  <div class="header">
    <div>${arcLogo}</div>
    <div>
      <div class="company-name">${s.companyName || 'ARC ANALYTICALS'}</div>
      <div class="company-sub">
        Village Badisher, PO Koti,<br>
        District ${s.city || 'Panchkula'}, ${s.state || 'Haryana'} - ${s.pincode || '134205'}<br>
        Contact Person: Mr. Lekh Singh (Lucky Rana)<br>
        Contact No./ Email: ${s.phone || '+91 9896155909'}/ ${s.email || 'arcanalyticals@gmail.com'}
      </div>
    </div>
  </div>

  <div class="clearfix">
    <!-- META BOX (right side) -->
    <div class="meta-box">
      <table>
        <tr><td>Dated</td><td>${moment(quotation.createdAt || new Date()).format('DD/MM/YYYY')}</td></tr>
        <tr><td>Quotation No.</td><td>${quotation.quotationNo}</td></tr>
      </table>
      <table class="bank-section" style="margin-top:6px;border-top:1.5px solid #aaa">
        <tr><td>Name</td><td>${s.companyName || 'Arc Analyticals'}</td></tr>
        <tr><td>Account No.</td><td>${s.accountNo || '25986155509'}</td></tr>
        <tr><td>SWIFT Code</td><td>${s.swiftCode || 'INDBINBBCHS'}</td></tr>
        <tr><td>IFSC Code</td><td>${s.ifsc || 'INDB0008090'}</td></tr>
        <tr><td>Branch</td><td>${s.bankName || 'IndusInd Bank'}</td></tr>
        <tr><td>GST No.</td><td>${s.gst || '06GEGPS4510P1ZZ'} | IE Code: ${s.ieCode || 'GEGPS4510P'}</td></tr>
      </table>
    </div>

    <!-- TO SECTION -->
    <div class="to-section">
      <div class="to-label">To: &nbsp; M/S &nbsp; ${client.companyName || ''}</div>
      ${client.address ? `<div>${client.address}</div>` : ''}
      ${client.city ? `<div>${client.city}${client.state ? ', '+client.state : ''}</div>` : ''}
      <div style="margin-top:6px">Contact Person &nbsp;&nbsp;&nbsp;&nbsp; - &nbsp; ${client.contactPerson || ''}</div>
      <div>Contact no &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; - &nbsp; ${client.phone || ''}</div>
    </div>
  </div>

  <div class="subject">Subject: Quotation</div>
  <div class="dear">Dear Sir,</div>
  <div class="writing">We are writing to request a quotation for the following items:</div>

  <!-- ITEMS TABLE -->
  <table class="items-table">
    <thead>
      <tr>
        <th style="width:45px">No.</th>
        <th class="left">Description</th>
        <th style="width:90px">Model</th>
        <th style="width:50px">Qty</th>
        <th style="width:90px">Amount</th>
        <th style="width:100px">Total Amount</th>
      </tr>
    </thead>
    <tbody>${itemsHTML}</tbody>
    <tfoot>
      <tr>
        <td colspan="5">Subtotal</td>
        <td style="text-align:right">${formatINR(subtotal)}</td>
      </tr>
      <tr>
        <td colspan="5">GST ${gstPct}%</td>
        <td style="text-align:right">${formatINR(gstAmount)}</td>
      </tr>
      <tr class="total-row">
        <td colspan="5" style="text-align:center;letter-spacing:2px">TOTAL</td>
        <td style="text-align:right">${formatINR(total)}</td>
      </tr>
    </tfoot>
  </table>

  ${quotation.notes ? `<p style="font-size:11px;margin:8px 0;color:#555">${quotation.notes}</p>` : ''}

  <div style="margin-top:10px;font-size:10px;color:#666">
    ${moment().format('MM/DD/YYYY')}
  </div>

  <!-- Decorative bottom wave -->
  <div class="deco-bottom" style="margin-top:20px">
    <svg width="100%" height="90" viewBox="0 0 595 90" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <ellipse cx="100" cy="110" rx="200" ry="80" fill="#d4a06a" opacity="0.5"/>
      <ellipse cx="300" cy="120" rx="300" ry="70" fill="#8b3a0f" opacity="0.6"/>
      <ellipse cx="550" cy="100" rx="200" ry="90" fill="#5a1a0a" opacity="0.5"/>
    </svg>
  </div>
</div>

<!-- PAGE 2 — TERMS & CONDITIONS -->
<div class="page" style="page-break-before:always">
  <div class="deco-top">
    <svg width="180" height="160" viewBox="0 0 180 160" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="160" cy="30" rx="80" ry="50" fill="#d4a06a" opacity="0.5" transform="rotate(-20 160 30)"/>
      <ellipse cx="175" cy="60" rx="70" ry="40" fill="#8b3a0f" opacity="0.7" transform="rotate(-10 175 60)"/>
      <ellipse cx="165" cy="100" rx="90" ry="35" fill="#5a1a0a" opacity="0.6" transform="rotate(5 165 100)"/>
    </svg>
  </div>

  <!-- HEADER repeat -->
  <div class="header">
    <div>${arcLogo}</div>
    <div>
      <div class="company-name">${s.companyName || 'ARC ANALYTICALS'}</div>
      <div class="company-sub">
        Village Badisher, PO Koti, District ${s.city || 'Panchkula'}, ${s.state || 'Haryana'} - ${s.pincode || '134205'}<br>
        Contact Person: Mr. Lekh Singh (Lucky Rana)<br>
        Contact No./ Email: ${s.phone || '+91 9896155909'}/ ${s.email || 'arcanalyticals@gmail.com'}
      </div>
    </div>
  </div>

  <div style="font-size:14px;font-weight:700;margin:14px 0 10px">Terms &amp; Conditions</div>
  <div style="font-size:11.5px;line-height:2">
    ${termsHTML}
  </div>

  <div style="margin-top:30px;font-size:10.5px;color:#666">${moment().format('MM/DD/YYYY')}</div>

  <div style="text-align:right;margin-top:40px;padding-right:20px">
    <div style="font-size:13px;font-weight:700">For – ${s.companyName || 'ARC Analyticals'} Authorised Signatory</div>
  </div>

  <div class="deco-bottom" style="margin-top:40px">
    <svg width="100%" height="90" viewBox="0 0 595 90" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <ellipse cx="100" cy="110" rx="200" ry="80" fill="#d4a06a" opacity="0.5"/>
      <ellipse cx="300" cy="120" rx="300" ry="70" fill="#8b3a0f" opacity="0.6"/>
      <ellipse cx="550" cy="100" rx="200" ry="90" fill="#5a1a0a" opacity="0.5"/>
    </svg>
  </div>
</div>

</body>
</html>`;

  const browser = await puppeteer.launch({ headless:'new', args:['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil:'networkidle0' });
  await page.pdf({ path:outputPath, format:'A4', printBackground:true, margin:{top:'0',bottom:'0',left:'0',right:'0'} });
  await browser.close();
  return outputPath;
};

module.exports = { generateQuotationPDF, generateInvoicePDF };
