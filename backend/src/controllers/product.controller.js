const { validationResult } = require('express-validator');
const prisma = require('../config/prisma');

// Get all products with filtering
const getProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      category, 
      warehouseId,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter conditions
    const where = {};
    
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
      price,
      mrp,
      shelf,
      rack,
      reorderLevel,
      status
    } = req.body;

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

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        genericName,
        price: price ? parseFloat(price) : undefined,
        mrp: mrp ? parseFloat(mrp) : undefined,
        shelf,
        rack,
        reorderLevel: reorderLevel ? parseInt(reorderLevel) : undefined,
        status
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        action: 'UPDATE',
        entityType: 'PRODUCT',
        entityId: id,
        userId: req.user.id,
        details: { 
          productName: product.name,
          changes: req.body
        },
        ipAddress: req.ip,
        device: req.headers['user-agent']
      }
    });

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Delete product
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

    // Check if product has movements
    const movements = await prisma.stockMovement.count({
      where: { productId: id }
    });

    if (movements > 0) {
      // Soft delete - just mark as discontinued
      await prisma.product.update({
        where: { id },
        data: { status: 'DISCONTINUED' }
      });
    } else {
      // Hard delete if no movements
      await prisma.product.delete({
        where: { id }
      });
    }

    // Log activity
    await prisma.activity.create({
      data: {
        action: 'DELETE',
        entityType: 'PRODUCT',
        entityId: id,
        userId: req.user.id,
        details: { 
          productName: product.name,
          hadMovements: movements > 0
        },
        ipAddress: req.ip,
        device: req.headers['user-agent']
      }
    });

    res.json({
      success: true,
      message: movements > 0 
        ? 'Product discontinued successfully' 
        : 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
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