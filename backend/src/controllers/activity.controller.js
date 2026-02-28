const prisma = require('../config/prisma');

// Get all activities with filters
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

    console.log('📋 Activity filters received:', { page, limit, startDate, endDate, action, search });

    // Build filter conditions
    const where = {};

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
        console.log('📋 Start date:', new Date(startDate));
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
        console.log('📋 End date:', new Date(endDate));
      }
    }

    // Action filter
    if (action && action !== 'all' && action !== 'undefined') {
      where.action = action;
      console.log('📋 Action filter:', action);
    }

    // User filter
    if (userId) {
      where.userId = userId;
    }

    // Entity type filter
    if (entityType) {
      where.entityType = entityType;
    }

    // Search filter
    if (search && search.trim() !== '') {
      where.OR = [
        { details: { contains: search, mode: 'insensitive' } },
        { entityType: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } }
      ];
      console.log('📋 Search filter:', search);
    }

    // Get total count for pagination
    const total = await prisma.activity.count({ where });
    console.log('📋 Total matching activities:', total);

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

    console.log(`📋 Returning ${activities.length} activities`);

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
// Export activities to CSV
const exportToCSV = async (req, res) => {
  try {
    const { startDate, endDate, action } = req.query;
    
    console.log('📋 Exporting CSV with filters:', { startDate, endDate, action });

    // Build filter conditions
    const where = {};
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    
    if (action && action !== 'all') {
      where.action = action;
    }

    const activities = await prisma.activity.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { name: true, batchNumber: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📋 Exporting ${activities.length} activities to CSV`);

    // Create CSV content
    let csv = 'Timestamp,Action,Entity Type,Entity ID,User,User Email,Product,Batch Number,Details,IP Address,Device\n';
    
    for (const activity of activities) {
      const row = [
        activity.createdAt.toISOString(),
        activity.action,
        activity.entityType || '',
        activity.entityId || '',
        activity.user?.name || '',
        activity.user?.email || '',
        activity.product?.name || '',
        activity.product?.batchNumber || '',
        JSON.stringify(activity.details || {}).replace(/,/g, ';'), // Replace commas to avoid CSV issues
        activity.ipAddress || '',
        activity.device || ''
      ].map(field => `"${field}"`).join(',');
      
      csv += row + '\n';
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=activities-${Date.now()}.csv`);
    res.setHeader('Content-Length', Buffer.byteLength(csv));
    res.send(csv);

  } catch (error) {
    console.error('❌ Error exporting to CSV:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Export activities to PDF (simplified HTML version)
const exportToPDF = async (req, res) => {
  try {
    const { startDate, endDate, action } = req.query;
    
    console.log('📋 Exporting PDF with filters:', { startDate, endDate, action });

    // Build filter conditions
    const where = {};
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    
    if (action && action !== 'all') {
      where.action = action;
    }

    const activities = await prisma.activity.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📋 Exporting ${activities.length} activities to PDF`);

    // Create HTML for PDF
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Activity History</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #007AFF; }
            .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th { background: #007AFF; color: white; padding: 8px; text-align: left; }
            td { padding: 6px; border-bottom: 1px solid #ddd; }
            tr:nth-child(even) { background: #f9f9f9; }
            .timestamp { color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Activity History Report</h1>
            <p>Generated: ${new Date().toLocaleString()}</p>
          </div>
          
          <p><strong>Total Activities:</strong> ${activities.length}</p>
          ${startDate ? `<p><strong>From:</strong> ${new Date(startDate).toLocaleDateString()}</p>` : ''}
          ${endDate ? `<p><strong>To:</strong> ${new Date(endDate).toLocaleDateString()}</p>` : ''}
          ${action && action !== 'all' ? `<p><strong>Action:</strong> ${action}</p>` : ''}
          
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
                  <td><strong>${a.action}</strong></td>
                  <td>${a.entityType || '-'}</td>
                  <td>${a.user?.name || '-'}</td>
                  <td>${JSON.stringify(a.details || {}).substring(0, 50)}${JSON.stringify(a.details || {}).length > 50 ? '...' : ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename=activities-${Date.now()}.html`);
    res.setHeader('Content-Length', Buffer.byteLength(html));
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