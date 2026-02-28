const prisma = require('../config/prisma');

// Get all activities with filters
const getActivities = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      action,
      userId,
      entityType,
      search
    } = req.query;

    // Build filter conditions
    const where = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (action) where.action = action;
    if (userId) where.userId = userId;
    if (entityType) where.entityType = entityType;

    if (search) {
      where.OR = [
        { details: { contains: search, mode: 'insensitive' } },
        { entityType: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get total count for pagination
    const total = await prisma.activity.count({ where });

    // Get activities
    const activities = await prisma.activity.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            batchNumber: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    res.json({
      success: true,
      data: activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ Error fetching activities:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get activity by ID
const getActivityById = async (req, res) => {
  try {
    const { id } = req.params;

    const activity = await prisma.activity.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            batchNumber: true,
            company: true
          }
        }
      }
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    res.json({
      success: true,
      data: activity
    });

  } catch (error) {
    console.error('❌ Error fetching activity:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get activity statistics
const getActivityStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalCount,
      todayCount,
      weekCount,
      monthCount,
      actionDistribution,
      userActivity
    ] = await Promise.all([
      // Total activities
      prisma.activity.count(),
      
      // Today's activities
      prisma.activity.count({
        where: {
          createdAt: { gte: startOfDay }
        }
      }),
      
      // This week's activities
      prisma.activity.count({
        where: {
          createdAt: { gte: startOfWeek }
        }
      }),
      
      // This month's activities
      prisma.activity.count({
        where: {
          createdAt: { gte: startOfMonth }
        }
      }),
      
      // Action distribution
      prisma.activity.groupBy({
        by: ['action'],
        _count: true,
        orderBy: {
          _count: { action: 'desc' }
        },
        take: 10
      }),
      
      // Most active users
      prisma.activity.groupBy({
        by: ['userId'],
        _count: true,
        orderBy: {
          _count: { userId: 'desc' }
        },
        take: 5
      })
    ]);

    // Get user details for the most active users
    const topUsers = await Promise.all(
      userActivity.map(async (item) => {
        const user = await prisma.user.findUnique({
          where: { id: item.userId },
          select: { name: true, email: true }
        });
        return {
          ...user,
          count: item._count
        };
      })
    );

    res.json({
      success: true,
      data: {
        total: totalCount,
        today: todayCount,
        week: weekCount,
        month: monthCount,
        actionDistribution: actionDistribution.map(item => ({
          action: item.action,
          count: item._count
        })),
        topUsers
      }
    });

  } catch (error) {
    console.error('❌ Error fetching activity stats:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Export activities to CSV
const exportToCSV = async (req, res) => {
  try {
    const { startDate, endDate, action, userId } = req.query;

    // Build filter conditions
    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    if (action) where.action = action;
    if (userId) where.userId = userId;

    const activities = await prisma.activity.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { name: true, batchNumber: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Create CSV content
    const csvRows = [];
    
    // Headers
    csvRows.push([
      'Timestamp',
      'Action',
      'Entity Type',
      'Entity ID',
      'User',
      'User Email',
      'Product',
      'Batch Number',
      'Details',
      'IP Address',
      'Device'
    ].join(','));

    // Data rows
    for (const activity of activities) {
      csvRows.push([
        activity.createdAt.toISOString(),
        activity.action,
        activity.entityType || '',
        activity.entityId || '',
        activity.user?.name || '',
        activity.user?.email || '',
        activity.product?.name || '',
        activity.product?.batchNumber || '',
        JSON.stringify(activity.details || {}),
        activity.ipAddress || '',
        activity.device || ''
      ].map(field => `"${field}"`).join(','));
    }

    const csv = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=activities-${Date.now()}.csv`);
    res.send(csv);

  } catch (error) {
    console.error('❌ Error exporting to CSV:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Export activities to PDF (simplified - you might want to use a PDF library)
const exportToPDF = async (req, res) => {
  try {
    const activities = await prisma.activity.findMany({
      include: {
        user: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 1000
    });

    // Create HTML for PDF
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Activity History</title>
          <style>
            body { font-family: Arial; padding: 20px; }
            h1 { color: #007AFF; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #007AFF; color: white; padding: 10px; text-align: left; }
            td { padding: 8px; border-bottom: 1px solid #ddd; }
            .timestamp { font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <h1>Activity History Report</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <p>Total Activities: ${activities.length}</p>
          
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Entity</th>
                <th>User</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              ${activities.map(a => `
                <tr>
                  <td class="timestamp">${new Date(a.createdAt).toLocaleString()}</td>
                  <td>${a.action}</td>
                  <td>${a.entityType || '-'}</td>
                  <td>${a.user?.name || '-'}</td>
                  <td>${JSON.stringify(a.details || {})}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename=activities-${Date.now()}.html`);
    res.send(html);

  } catch (error) {
    console.error('❌ Error exporting to PDF:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getActivities,
  getActivityById,
  getActivityStats,
  exportToCSV,
  exportToPDF
};