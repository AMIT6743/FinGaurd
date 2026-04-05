const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');

const userRoutes = require('./routes/userRoutes');
const recordRoutes = require('./routes/recordRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// ── Security: HTTP headers ────────────────────────────────────────
app.use(helmet());

// ── Performance: gzip compression ────────────────────────────────
app.use(compression());

// Enable CORS
app.use(cors());

// Swagger Documentation
const swaggerFile = fs.readFileSync(path.join(__dirname, 'swagger.yaml'), 'utf8');
const swaggerDocument = YAML.parse(swaggerFile);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ── Rate Limiting ─────────────────────────────────────────────────
// Global limiter: 200 req / 15 min per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});

// Auth limiter: only 20 login attempts / 15 min per IP (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again after 15 minutes' }
});

app.use(globalLimiter);

// Middleware
app.use(express.json({ limit: '1mb' }));

// Routes
app.use('/api/users/login', authLimiter);   // tight limit on login
app.use('/api/users', userRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

// ── Static Assets (Frontend) ──────────────────────────────────────
const frontendPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  // Serve index.html for all non-API routes (SPA fallback)
  app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'Finance Dashboard API'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Map known service errors to proper HTTP status codes
  let status = err.status || 500;
  const msg = err.message || 'Internal Server Error';

  if (msg.includes('already exists') || msg.includes('already in use')) status = 409;
  else if (msg.includes('not found')) status = 404;
  else if (msg.includes('not authorized') || msg.includes('Not authorized')) status = 403;
  else if (msg.includes('required')) status = 400;

  res.status(status).json({
    error: msg,
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
