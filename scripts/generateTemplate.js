import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const wb = XLSX.utils.book_new();

// Sheet 1: Transactions
const txHeaders  = ['date','type','amount','baseAmount','gstRate','gstAmount','partyName','category','note','invoiceNumber'];
const txHints    = ['YYYY-MM-DD','sale|purchase|expense|receipt|payment','number (positive)','number (optional)','5|12|18|28|0|blank','number (optional)','text','text','text (max 500)','text'];
const txExample  = ['2026-03-01','sale',1180,1000,18,180,'Ramesh Traders','Sales','Morning sale',''];
const txWS = XLSX.utils.aoa_to_sheet([txHeaders, txHints, txExample]);
XLSX.utils.book_append_sheet(wb, txWS, 'Transactions');

// Sheet 2: Party_Balances
const pbHeaders = ['partyName', 'balanceType', 'amount'];
const pbHints = ['text', 'To Receive | To Pay', 'number'];
const pbExample = ['Ramesh Traders', 'To Receive', 5000];
const pbWS = XLSX.utils.aoa_to_sheet([pbHeaders, pbHints, pbExample]);
XLSX.utils.book_append_sheet(wb, pbWS, 'Party_Balances');

// Sheet 3: Parties
const ptHeaders = ['name', 'phone', 'gstin', 'address'];
const ptHints = ['text', 'text', 'text', 'text'];
const ptExample = ['Ramesh Traders', '9876543210', '27AAPXU0000A1Z5', 'Mumbai'];
const ptWS = XLSX.utils.aoa_to_sheet([ptHeaders, ptHints, ptExample]);
XLSX.utils.book_append_sheet(wb, ptWS, 'Parties');

// Sheet 4: GST_History
const gstHeaders = ['month', 'year', 'outputGST', 'inputGST', 'netPayable'];
const gstHints = ['1-12', 'YYYY', 'number', 'number', 'number'];
const gstExample = [2, 2026, 180, 0, 180];
const gstWS = XLSX.utils.aoa_to_sheet([gstHeaders, gstHints, gstExample]);
XLSX.utils.book_append_sheet(wb, gstWS, 'GST_History');

// Sheet 5: README
const readmeData = [
  ['ALL IN BOOKS — Import Template Instructions'],
  [''],
  ['HOW TO USE THIS FILE:'],
  ['1. Fill in the Transactions sheet starting from Row 4 (Row 1=headers, Row 2=hints, Row 3=example)'],
  ['2. Fill Party_Balances for any parties with an outstanding balance'],
  ['3. Fill Parties with phone/GSTIN/address for your contacts (optional but recommended)'],
  ['4. Fill GST_History only if importing historical GST filing data'],
  ['5. Save this file as .xlsx'],
  ['6. Open All in Books → Settings → Import → Upload this file']
];
const readmeWS = XLSX.utils.aoa_to_sheet(readmeData);
XLSX.utils.book_append_sheet(wb, readmeWS, 'README');

// Write to base64
const b64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

const targetDir = path.resolve('src', 'assets');
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

fs.writeFileSync(path.join(targetDir, 'importTemplate.b64.js'), `export const IMPORT_TEMPLATE_B64 = '${b64}';\n`);
console.log('Template generated at src/assets/importTemplate.b64.js');
