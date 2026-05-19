const fs = require('fs');
const filename = process.argv[2] || 'test-pdf-output.txt';
const text = fs.readFileSync(filename, 'utf-8');

function parsePDF(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  const items = [];
  let invoiceNo = '';
  let party = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Invoice No
    if (line.toLowerCase().startsWith('bill no :')) {
      invoiceNo = line.substring(9).trim();
    }
    
    // Party
    if (line.startsWith('M/s ')) {
      party = line.trim();
    }
    
    // Match serial number like "1.", "2."
    if (/^\d+\.$/.test(line) && i + 5 < lines.length) {
      const productName = lines[i + 3];
      const batchNumber = lines[i + 4];
      const numbersLine = lines[i + 5];
      
      const parts = numbersLine.trim().split(/\s+/);
      if (parts.length >= 7) {
        const expiry = parts[0]; // e.g. "3/28"
        const qty = parseInt(parts[1], 10);
        const rate = parseFloat(parts[3]);
        const amount = parseFloat(parts[parts.length - 1]);
        
        // Convert expiry "MM/YY" to "YYYY-MM-DD"
        let expiryDate = '';
        if (expiry.includes('/')) {
           const [m, y] = expiry.split('/');
           expiryDate = `20${y}-${m.padStart(2, '0')}-01`;
        }
        
        items.push({
          productName,
          batchNumber,
          quantity: qty,
          price: rate,
          expiryDate,
          notes: ''
        });
      }
      // Skip the matched lines
      i += 5;
    }
  }
  
  return { invoiceNo, party, items };
}

console.log(JSON.stringify(parsePDF(text), null, 2));
