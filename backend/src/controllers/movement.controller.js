const prisma = require('../config/prisma');
const csv = require('csv-parser');
const { Readable } = require('stream');
const { createWorker } = require('tesseract.js');
const pdf = require('pdf-parse');

const normalizePrice = (raw) => {
  if (!raw) return null;
  const cleaned = raw.replace(/,/g, '.').replace(/[^0-9.]/g, '');
  const value = parseFloat(cleaned);
  return Number.isNaN(value) ? null : value;
};

const parseReceiptText = (text) => {
  const lines = text
    .replace(/\r/g, '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  const items = [];
  let invoiceNo = '';
  let party = '';

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s{2,}/g, ' ').trim();
    if (!line) continue;

    if (!invoiceNo && /(invoice|bill\s*no|bill#|receipt\s*no|inv[:\-]?)/i.test(line)) {
      invoiceNo = line.split(/invoice|bill\s*no|bill#|receipt\s*no|inv[:\-]?/i)[1]?.trim() || '';
      continue;
    }

    if (!party && /(customer|party|vendor|supplier|to|from)/i.test(line) && /[:\-]/.test(line)) {
      party = line.split(/[:\-]/).slice(1).join('').trim();
      continue;
    }

    if (/total|subtotal|tax|gst|vat|amount due|balance/i.test(line)) {
      continue;
    }

    const quantityPricePatterns = [
      { regex: /^(.*?)\s+x\s*(\d+)\s+([0-9]+(?:[.,][0-9]{2})?)$/i, order: ['name', 'qty', 'price'] },
      { regex: /^(.*?)\s+(\d+)\s+([0-9]+(?:[.,][0-9]{2})?)$/i, order: ['name', 'qty', 'price'] },
      { regex: /^(.*?)\s+([0-9]+(?:[.,][0-9]{2})?)\s+(\d+)$/i, order: ['name', 'price', 'qty'] }
    ];

    let parsed = null;
    for (const patternObj of quantityPricePatterns) {
      const match = line.match(patternObj.regex);
      if (match) {
        const [, name, firstValue, secondValue] = match;
        const productName = name.trim().replace(/[^\w\s\-.,]/g, '');
        const quantity = parseInt(patternObj.order[1] === 'qty' ? firstValue : secondValue, 10);
        const normalizedPrice = normalizePrice(patternObj.order[1] === 'price' ? firstValue : secondValue);
        if (productName.length >= 2 && quantity > 0) {
          parsed = {
            productName,
            quantity,
            price: normalizedPrice,
            batchNumber: '',
            notes: ''
          };
          break;
        }
      }
    }

    if (parsed) {
      items.push(parsed);
    }
  }

  return {
    items,
    invoiceNo,
    party
  };
};

const scanReceipt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No receipt image uploaded'
      });
    }


    /**
     * IMPORTANT:
     * createWorker must be awaited
     */
    const worker = await createWorker('eng', 1);

    /**
     * OCR
     */
    const result = await worker.recognize(req.file.buffer);

    const text = result?.data?.text || '';
    const confidence = result?.data?.confidence || 0;

    /**
     * Cleanup worker
     */
    await worker.terminate();


    /**
     * Parse receipt text
     */
    const parsed = parseReceiptText(text);

    return res.json({
      success: true,
      data: {
        text,
        confidence,
        ...parsed
      }
    });

  } catch (error) {
    console.error('❌ Error scanning receipt:', error);
    console.error(error.stack);

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to scan receipt or parse text'
    });
  }
};
const batchCreateMovements = async (req, res) => {
  try {
    const userId = req.user.id;
    const items = Array.isArray(req.body.items) ? req.body.items : [];

    if (items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items to save' });
    }

    const results = [];
    const errors = [];

    for (const [index, item] of items.entries()) {
      try {
        const type = item.type || 'STOCK_IN';
        const quantity = parseInt(item.quantity, 10);
        if (!quantity || quantity <= 0) {
          throw new Error('Invalid quantity');
        }

        let product = null;
        if (item.productId) {
          product = await prisma.product.findUnique({ where: { id: item.productId } });
        } else if (item.productName) {
          if (type === 'STOCK_IN') {
            // For receiving, require exact name and batch match (or 'UNKNOWN' if no batch)
            product = await prisma.product.findFirst({
              where: {
                name: { equals: item.productName, mode: 'insensitive' },
                batchNumber: item.batchNumber || 'UNKNOWN'
              }
            });
          } else {
            // For sales, require exact name and batch. Reject if batch is missing.
            if (!item.batchNumber) {
              throw new Error(`Missing batch number. Please specify the batch number when manually selling ${item.productName}.`);
            }
            product = await prisma.product.findFirst({
              where: {
                name: { equals: item.productName, mode: 'insensitive' },
                batchNumber: item.batchNumber
              }
            });
          }
        }

        if (!product) {
          if (type === 'STOCK_IN') {
            const defaultWarehouse = await prisma.warehouse.findFirst();
            if (!defaultWarehouse) throw new Error("No warehouse available to store new product");
             
            product = await prisma.product.create({
              data: {
                name: item.productName || 'Unknown Product',
                batchNumber: item.batchNumber || 'UNKNOWN',
                expiryDate: item.expiryDate ? new Date(item.expiryDate) : new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                price: item.price ? parseFloat(item.price) : 0,
                mrp: item.mrp ? parseFloat(item.mrp) : null,
                company: item.party || 'Imported',
                warehouseId: defaultWarehouse.id,
                quantity: 0,
                status: 'ACTIVE'
              }
            });
          } else {
            throw new Error(`Product not found: ${item.productName}`);
          }
        }

        if (type === 'STOCK_OUT' && product.quantity < quantity) {
          throw new Error(`Insufficient quantity for ${product.name}`);
        }

        const price = item.price ? parseFloat(item.price) : product.price;
        const totalAmount = item.totalAmount ? parseFloat(item.totalAmount) : price * quantity;
        const newQuantity = type === 'STOCK_IN'
          ? product.quantity + quantity
          : product.quantity - quantity;

        const [movement] = await prisma.$transaction([
          prisma.stockMovement.create({
            data: {
              type,
              quantity,
              productId: product.id,
              userId,
              party: item.party,
              invoiceNo: item.invoiceNo,
              notes: item.notes,
              batchNumber: item.batchNumber || product.batchNumber,
              expiryDate: item.expiryDate ? new Date(item.expiryDate) : product.expiryDate,
              price,
              totalAmount
            }
          }),
          prisma.product.update({
            where: { id: product.id },
            data: {
              quantity: newQuantity,
              status: newQuantity === 0
                ? 'OUT_OF_STOCK'
                : newQuantity < (product.reorderLevel || 100)
                  ? 'LOW_STOCK'
                  : 'ACTIVE'
            }
          })
        ]);

        if (type === 'STOCK_OUT' && newQuantity < (product.reorderLevel || 100)) {
          await prisma.notification.create({
            data: {
              type: 'LOW_STOCK',
              title: 'Low Stock Alert',
              message: `${product.name} is now below reorder level`,
              severity: 'MEDIUM',
              userId,
              productId: product.id,
              data: {
                currentQuantity: newQuantity,
                reorderLevel: product.reorderLevel || 100,
                movementId: movement.id
              }
            }
          });
        }

        // Expiry notification check
        const movementExpiry = item.expiryDate ? new Date(item.expiryDate) : product.expiryDate;
        if (type === 'STOCK_IN' && movementExpiry) {
          const now = new Date();
          const threeMonthsFromNow = new Date();
          threeMonthsFromNow.setMonth(now.getMonth() + 3);

          if (movementExpiry < now) {
            await prisma.notification.create({
              data: {
                type: 'EXPIRY',
                title: 'Product Expired',
                message: `${product.name} (Batch: ${item.batchNumber || product.batchNumber || 'N/A'}) has expired.`,
                severity: 'CRITICAL',
                userId,
                productId: product.id,
                data: { expiryDate: movementExpiry }
              }
            });
          } else if (movementExpiry < threeMonthsFromNow) {
            await prisma.notification.create({
              data: {
                type: 'EXPIRY',
                title: 'Product Expiring Soon',
                message: `${product.name} (Batch: ${item.batchNumber || product.batchNumber || 'N/A'}) is expiring soon.`,
                severity: 'HIGH',
                userId,
                productId: product.id,
                data: { expiryDate: movementExpiry }
              }
            });
          }
        }

        results.push(movement);
      } catch (error) {
        errors.push({ index, item, error: error.message });
      }
    }

    await prisma.activity.create({
      data: {
        action: 'BATCH_IMPORT',
        entityType: 'MOVEMENT',
        userId,
        details: {
          totalRows: items.length,
          successCount: results.length,
          errorCount: errors.length
        },
        ipAddress: req.ip,
        device: req.headers['user-agent']
      }
    });

    res.json({
      success: true,
      message: `Processed ${results.length} of ${items.length} receipt items`,
      data: {
        processed: results.length,
        errors,
        items: results
      }
    });
  } catch (error) {
    console.error('❌ Error saving batch movements:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get all movements with filters
const getMovements = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      type,
      productId,
      userId,
      search
    } = req.query;

    // Build filter conditions
    const where = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (type) where.type = type;
    if (productId) where.productId = productId;
    if (userId) where.userId = userId;
    
    if (search) {
      where.OR = [
        { party: { contains: search, mode: 'insensitive' } },
        { product: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Get total count
    const total = await prisma.stockMovement.count({ where });

    // Get movements
    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            batchNumber: true,
            company: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    res.json({
      success: true,
      data: movements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ Error fetching movements:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get movement by ID
const getMovementById = async (req, res) => {
  try {
    const { id } = req.params;

    const movement = await prisma.stockMovement.findUnique({
      where: { id },
      include: {
        product: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!movement) {
      return res.status(404).json({
        success: false,
        message: 'Movement not found'
      });
    }

    res.json({
      success: true,
      data: movement
    });

  } catch (error) {
    console.error('❌ Error fetching movement:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Create new movement
const createMovement = async (req, res) => {
  try {
    const {
      type,
      quantity,
      productId,
      party,
      invoiceNo,
      notes,
      batchNumber,
      expiryDate,
      price,
      totalAmount
    } = req.body;

    const userId = req.user.id;

    // Validate product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // For STOCK_OUT, check if sufficient quantity
    if (type === 'STOCK_OUT' && product.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient quantity. Available: ${product.quantity}`
      });
    }

    // Create movement
    const movement = await prisma.stockMovement.create({
      data: {
        type,
        quantity: parseInt(quantity),
        productId,
        userId,
        party,
        invoiceNo,
        notes,
        batchNumber: batchNumber || product.batchNumber,
        expiryDate: expiryDate ? new Date(expiryDate) : product.expiryDate,
        price: price ? parseFloat(price) : product.price,
        totalAmount: totalAmount ? parseFloat(totalAmount) : (parseFloat(price || product.price) * parseInt(quantity))
      }
    });

    // Update product quantity
    const newQuantity = type === 'STOCK_IN' 
      ? product.quantity + parseInt(quantity)
      : product.quantity - parseInt(quantity);

    await prisma.product.update({
      where: { id: productId },
      data: { 
        quantity: newQuantity,
        status: newQuantity === 0 ? 'OUT_OF_STOCK' : 
                newQuantity < (product.reorderLevel || 100) ? 'LOW_STOCK' : 'ACTIVE'
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        action: type,
        entityType: 'MOVEMENT',
        entityId: movement.id,
        userId,
        details: {
          productName: product.name,
          quantity,
          party,
          invoiceNo
        },
        ipAddress: req.ip,
        device: req.headers['user-agent']
      }
    });

    // Create notification for low stock if needed
    if (type === 'STOCK_OUT' && newQuantity < (product.reorderLevel || 100)) {
      await prisma.notification.create({
        data: {
          type: 'LOW_STOCK',
          title: 'Low Stock Alert',
          message: `${product.name} is now below reorder level`,
          severity: 'MEDIUM',
          userId,
          productId,
          data: {
            currentQuantity: newQuantity,
            reorderLevel: product.reorderLevel || 100,
            movementId: movement.id
          }
        }
      });
    }

    // Expiry notification check
    const movementExpiry = expiryDate ? new Date(expiryDate) : product.expiryDate;
    if (type === 'STOCK_IN' && movementExpiry) {
      const now = new Date();
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(now.getMonth() + 3);

      if (movementExpiry < now) {
        await prisma.notification.create({
          data: {
            type: 'EXPIRY',
            title: 'Product Expired',
            message: `${product.name} (Batch: ${batchNumber || product.batchNumber || 'N/A'}) has expired.`,
            severity: 'CRITICAL',
            userId,
            productId: product.id,
            data: { expiryDate: movementExpiry }
          }
        });
      } else if (movementExpiry < threeMonthsFromNow) {
        await prisma.notification.create({
          data: {
            type: 'EXPIRY',
            title: 'Product Expiring Soon',
            message: `${product.name} (Batch: ${batchNumber || product.batchNumber || 'N/A'}) is expiring soon.`,
            severity: 'HIGH',
            userId,
            productId: product.id,
            data: { expiryDate: movementExpiry }
          }
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Movement created successfully',
      data: movement
    });

  } catch (error) {
    console.error('❌ Error creating movement:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get movement statistics
// Get movement statistics
const getMovementStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalIn,
      totalOut,
      todayIn,
      todayOut,
      weekIn,
      weekOut,
      monthIn,
      monthOut
    ] = await Promise.all([
      // Total IN
      prisma.stockMovement.count({ where: { type: 'STOCK_IN' } }),
      // Total OUT
      prisma.stockMovement.count({ where: { type: 'STOCK_OUT' } }),
      // Today IN
      prisma.stockMovement.count({ 
        where: { 
          type: 'STOCK_IN',
          createdAt: { gte: startOfDay }
        }
      }),
      // Today OUT
      prisma.stockMovement.count({ 
        where: { 
          type: 'STOCK_OUT',
          createdAt: { gte: startOfDay }
        }
      }),
      // Week IN
      prisma.stockMovement.count({ 
        where: { 
          type: 'STOCK_IN',
          createdAt: { gte: startOfWeek }
        }
      }),
      // Week OUT
      prisma.stockMovement.count({ 
        where: { 
          type: 'STOCK_OUT',
          createdAt: { gte: startOfWeek }
        }
      }),
      // Month IN
      prisma.stockMovement.count({ 
        where: { 
          type: 'STOCK_IN',
          createdAt: { gte: startOfMonth }
        }
      }),
      // Month OUT
      prisma.stockMovement.count({ 
        where: { 
          type: 'STOCK_OUT',
          createdAt: { gte: startOfMonth }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        today: { in: todayIn, out: todayOut },
        week: { in: weekIn, out: weekOut },
        month: { in: monthIn, out: monthOut },
        total: { in: totalIn, out: totalOut }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching movement stats:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Import movements from CSV
const importCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const userId = req.user.id;
    const results = [];
    const errors = [];

    // Parse CSV
    const stream = Readable.from(req.file.buffer.toString());
    
    await new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('error', (error) => reject(error))
        .on('end', () => resolve());
    });

    // Process each row
    for (const row of results) {
      try {
        // Find product by batch number or name
        const product = await prisma.product.findFirst({
          where: {
            OR: [
              { batchNumber: row.batchNumber },
              { name: row.productName }
            ]
          }
        });

        if (!product) {
          errors.push({ row, error: 'Product not found' });
          continue;
        }

        // Create movement
        await prisma.stockMovement.create({
          data: {
            type: row.type || 'STOCK_IN',
            quantity: parseInt(row.quantity),
            productId: product.id,
            userId,
            party: row.party,
            invoiceNo: row.invoiceNo,
            notes: row.notes,
            batchNumber: row.batchNumber || product.batchNumber,
            expiryDate: row.expiryDate ? new Date(row.expiryDate) : product.expiryDate,
            price: parseFloat(row.price) || product.price,
            totalAmount: parseFloat(row.totalAmount) || null
          }
        });

      } catch (error) {
        errors.push({ row, error: error.message });
      }
    }

    // Log activity
    await prisma.activity.create({
      data: {
        action: 'IMPORT',
        entityType: 'MOVEMENT',
        userId,
        details: {
          totalRows: results.length,
          successCount: results.length - errors.length,
          errorCount: errors.length
        },
        ipAddress: req.ip,
        device: req.headers['user-agent']
      }
    });

    res.json({
      success: true,
      message: `Imported ${results.length - errors.length} movements`,
      data: {
        total: results.length,
        imported: results.length - errors.length,
        errors: errors.length,
        errorDetails: errors
      }
    });

  } catch (error) {
    console.error('❌ Error importing CSV:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const parsePDFText = (text) => {
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
      if (parts.length >= 6) {
        const expiry = parts[0]; // e.g. "3/28"
        const qty = parseInt(parts[1], 10);
        const mrp = parseFloat(parts[2]);
        const rate = parseFloat(parts[3]);
        
        // Convert expiry "MM/YY" to "YYYY-MM-DD"
        let expiryDate = null;
        if (expiry.includes('/')) {
           const [m, y] = expiry.split('/');
           expiryDate = `20${y}-${m.padStart(2, '0')}-01`;
        }
        
        items.push({
          productName,
          batchNumber,
          quantity: qty,
          mrp,
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
};

// Import movements from PDF
const importPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const pdfData = await pdf(req.file.buffer);
    
    const parsedData = parsePDFText(pdfData.text);
    
    if (parsedData.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract any tabular items from the PDF'
      });
    }

    // ✅ Duplicate Invoice Check
    let duplicateWarning = null;
    if (parsedData.invoiceNo) {
      const existingCount = await prisma.stockMovement.count({
        where: { invoiceNo: parsedData.invoiceNo }
      });
      if (existingCount > 0) {
        duplicateWarning = `Bill No. "${parsedData.invoiceNo}" has already been imported (${existingCount} items found).`;
      }
    }

    res.json({
      success: true,
      message: `Extracted ${parsedData.items.length} items from PDF`,
      duplicateWarning,
      data: parsedData
    });

  } catch (error) {
    console.error('❌ Error processing PDF:', error);
    res.status(500).json({ success: false, message: 'Failed to process PDF file' });
  }
};

// Get sales data for the last 7 days
const getSalesData = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const movements = await prisma.stockMovement.findMany({
      where: {
        type: 'STOCK_OUT',
        createdAt: {
          gte: sevenDaysAgo,
          lte: today
        }
      },
      select: {
        totalAmount: true,
        createdAt: true
      }
    });

    // Initialize array for last 7 days
    const labels = [];
    const data = [];
    const daysMap = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      labels.push(dayName);
      daysMap[dayName] = 0;
    }

    movements.forEach(m => {
      const dayName = new Date(m.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
      if (daysMap[dayName] !== undefined) {
        daysMap[dayName] += (m.totalAmount || 0);
      }
    });

    labels.forEach(label => {
      data.push(daysMap[label]);
    });

    res.json({
      success: true,
      data: {
        labels,
        datasets: [{
          data,
          color: "(opacity = 1) => `rgba(0, 122, 255, ${opacity})`",
          strokeWidth: 2
        }]
      }
    });
  } catch (error) {
    console.error('❌ Error fetching sales data:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getMovements,
  getMovementById,
  createMovement,
  getMovementStats,
  importCSV,
  importPDF,
  scanReceipt,
  batchCreateMovements,
  getSalesData
};