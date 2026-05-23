const { validationResult } = require('express-validator');
const prisma = require('../config/prisma');

// Get all products with filtering
const getProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      invoiceNo,
      category, 
      warehouseId,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter conditions
    const where = {};
    
    // Invoice number search — find products linked to this invoice via StockMovement
    if (invoiceNo) {
      const movements = await prisma.stockMovement.findMany({
        where: { invoiceNo: { contains: invoiceNo, mode: 'insensitive' } },
        select: { productId: true },
        distinct: ['productId']
      });
      const productIds = movements.map(m => m.productId);
      where.id = { in: productIds };
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { batchNumber: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (category) where.category = category;
    if (warehouseId) where.warehouseId = warehouseId;
    if (status) where.status = status;

    // Get total count for pagination
    const total = await prisma.product.count({ where });

    // Get products
    const products = await prisma.product.findMany({
      where,
      include: {
        warehouse: {
          select: { id: true, name: true }
        }
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { [sortBy]: sortOrder }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        action: 'VIEW',
        entityType: 'PRODUCT',
        userId: req.user.id,
        details: { filters: req.query, count: products.length },
        ipAddress: req.ip,
        device: req.headers['user-agent']
      }
    });

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Get single product by ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        warehouse: {
          select: { id: true, name: true, location: true }
        },
        movements: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true } }
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Log activity
    await prisma.activity.create({
      data: {
        action: 'VIEW',
        entityType: 'PRODUCT',
        entityId: id,
        userId: req.user.id,
        details: { productName: product.name },
        ipAddress: req.ip,
        device: req.headers['user-agent']
      }
    });

    res.json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Create new product
const createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const {
      name,
      genericName,
      batchNumber,
      expiryDate,
      quantity,
      price,
      mrp,
      company,
      category,
      manufacturer,
      warehouseId,
      shelf,
      rack,
      reorderLevel
    } = req.body;

    // Check if product with same batch exists
    const existingProduct = await prisma.product.findFirst({
      where: { batchNumber }
    });

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Product with this batch number already exists'
      });
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name,
        genericName,
        batchNumber,
        expiryDate: new Date(expiryDate),
        quantity: parseInt(quantity),
        price: parseFloat(price),
        mrp: mrp ? parseFloat(mrp) : null,
        company,
        category,
        manufacturer,
        warehouseId,
        shelf,
        rack,
        reorderLevel: reorderLevel ? parseInt(reorderLevel) : 100,
        status: parseInt(quantity) === 0 ? 'OUT_OF_STOCK' : 'ACTIVE'
      }
    });

    // Create stock movement record
    await prisma.stockMovement.create({
      data: {
        type: 'STOCK_IN',
        quantity: parseInt(quantity),
        productId: product.id,
        userId: req.user.id,
        batchNumber,
        expiryDate: new Date(expiryDate),
        price: parseFloat(price),
        totalAmount: parseFloat(price) * parseInt(quantity),
        notes: 'Initial stock entry'
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        action: 'CREATE',
        entityType: 'PRODUCT',
        entityId: product.id,
        userId: req.user.id,
        details: { 
          productName: product.name,
          batchNumber: product.batchNumber,
          quantity: product.quantity
        },
        ipAddress: req.ip,
        device: req.headers['user-agent']
      }
    });

    // Check for low stock notification
    if (product.quantity <= product.reorderLevel) {
      await prisma.notification.create({
        data: {
          type: 'LOW_STOCK',
          title: 'Low Stock Alert',
          message: `${product.name} is below reorder level`,
          severity: 'MEDIUM',
          userId: req.user.id,
          productId: product.id,
          data: {
            quantity: product.quantity,
            reorderLevel: product.reorderLevel
          }
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }


    // Prepare update data (only include fields that are provided)
    const updateData = {};
    
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.genericName !== undefined) updateData.genericName = req.body.genericName;
    if (req.body.batchNumber !== undefined) updateData.batchNumber = req.body.batchNumber;
    if (req.body.expiryDate !== undefined) updateData.expiryDate = new Date(req.body.expiryDate);
    if (req.body.quantity !== undefined) updateData.quantity = parseInt(req.body.quantity);
    if (req.body.price !== undefined) updateData.price = parseFloat(req.body.price);
    if (req.body.mrp !== undefined) updateData.mrp = req.body.mrp ? parseFloat(req.body.mrp) : null;
    if (req.body.company !== undefined) updateData.company = req.body.company;
    if (req.body.category !== undefined) updateData.category = req.body.category;
    if (req.body.manufacturer !== undefined) updateData.manufacturer = req.body.manufacturer;
    if (req.body.warehouseId !== undefined) updateData.warehouseId = req.body.warehouseId;
    if (req.body.shelf !== undefined) updateData.shelf = req.body.shelf;
    if (req.body.rack !== undefined) updateData.rack = req.body.rack;
    if (req.body.reorderLevel !== undefined) updateData.reorderLevel = parseInt(req.body.reorderLevel);
    if (req.body.status !== undefined) updateData.status = req.body.status;

    // Auto-update status based on quantity if quantity is being updated
    if (req.body.quantity !== undefined) {
      const newQuantity = parseInt(req.body.quantity);
      if (newQuantity === 0) {
        updateData.status = 'OUT_OF_STOCK';
      } else if (newQuantity < (existingProduct.reorderLevel || 100)) {
        updateData.status = 'LOW_STOCK';
      } else {
        updateData.status = 'ACTIVE';
      }
    }


    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData
    });


    // Log activity
    await prisma.activity.create({
      data: {
        action: 'UPDATE',
        entityType: 'PRODUCT',
        entityId: id,
        userId: req.user.id,
        details: { 
          productName: updatedProduct.name,
          changes: req.body
        },
        ipAddress: req.ip,
        device: req.headers['user-agent']
      }
    });

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });

  } catch (error) {
    console.error('❌ Backend - Update product error:', error);
    console.error('❌ Backend - Error code:', error.code);
    console.error('❌ Backend - Error message:', error.message);
    
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete product
// Delete product - MODIFIED VERSION
// Delete product - HARD DELETE with cascade
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }


    // Delete related records first (due to foreign key constraints)
    await prisma.stockMovement.deleteMany({
      where: { productId: id }
    });

    await prisma.activity.deleteMany({
      where: { productId: id }
    });

    await prisma.notification.deleteMany({
      where: { productId: id }
    });

    // Finally delete the product
    await prisma.product.delete({
      where: { id }
    });


    // Log activity
    await prisma.activity.create({
      data: {
        action: 'DELETE',
        entityType: 'PRODUCT',
        entityId: id,
        userId: req.user.id,
        details: { 
          productName: product.name,
          deletedAt: new Date().toISOString()
        },
        ipAddress: req.ip,
        device: req.headers['user-agent']
      }
    });

    res.json({
      success: true,
      message: 'Product and all related records permanently deleted',
    });

  } catch (error) {
    console.error('❌ Backend - Delete product error:', error);
    console.error('❌ Backend - Error code:', error.code);
    console.error('❌ Backend - Error message:', error.message);
    
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get product statistics for dashboard
const getProductStats = async (req, res) => {
  try {
    const [
      totalProducts,
      totalValue,
      lowStockCount,
      expiringCount,
      expiredCount,
      categoryDistribution
    ] = await Promise.all([
      // Total products
      prisma.product.count(),
      
      // Total inventory value
      prisma.product.aggregate({
        _sum: {
          price: true
        },
        where: {
          status: { not: 'DISCONTINUED' }
        }
      }),
      
      // Low stock count
      prisma.product.count({
        where: {
          quantity: { lte: prisma.product.fields.reorderLevel },
          status: 'ACTIVE'
        }
      }),
      
      // Expiring soon (next 30 days)
      prisma.product.count({
        where: {
          expiryDate: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            gt: new Date()
          },
          status: 'ACTIVE'
        }
      }),
      
      // Expired
      prisma.product.count({
        where: {
          expiryDate: { lt: new Date() }
        }
      }),
      
      // Category distribution
      prisma.product.groupBy({
        by: ['category'],
        _count: true,
        where: {
          category: { not: null }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalProducts,
        totalValue: totalValue._sum.price || 0,
        lowStock: lowStockCount,
        expiringSoon: expiringCount,
        expired: expiredCount,
        categories: categoryDistribution
      }
    });

  } catch (error) {
    console.error('Get product stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats
};