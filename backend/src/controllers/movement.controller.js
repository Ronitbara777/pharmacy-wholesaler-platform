const prisma = require('../config/prisma');
const csv = require('csv-parser');
const { Readable } = require('stream');

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
      userId
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

module.exports = {
  getMovements,
  getMovementById,
  createMovement,
  getMovementStats,
  importCSV
};