const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const warehouseRoutes = require('./routes/warehouse.routes');
const movementRoutes = require('./routes/movement.routes');
const notificationRoutes = require('./routes/notification.routes');
const activityRoutes = require('./routes/activity.routes');
const importRoutes = require('./routes/import.routes');


const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 150 // limit each IP to 150 requests per minute
});
app.use('/api', limiter);

// CORS
/*app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));*/

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// Compression
app.use(compression());

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use(`${process.env.API_PREFIX}/auth`, authRoutes);
app.use(`${process.env.API_PREFIX}/products`, productRoutes);
app.use(`${process.env.API_PREFIX}/warehouses`, warehouseRoutes);
app.use(`${process.env.API_PREFIX}/movements`, movementRoutes);
app.use(`${process.env.API_PREFIX}/notifications`, notificationRoutes);
app.use(`${process.env.API_PREFIX}/activities`, activityRoutes);
app.use(`${process.env.API_PREFIX}/import`, importRoutes);
app.use(`${process.env.API_PREFIX}/activities`, activityRoutes);
app.use(`${process.env.API_PREFIX}/movements`, movementRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
  console.log(`📚 API Prefix: ${process.env.API_PREFIX}`);
});