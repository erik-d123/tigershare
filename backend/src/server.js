// backend/src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');

// Import routes
const authRoutes = require('./routes/authRoutes');
const rideRoutes = require('./routes/rideRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');

// Create Express app
const app = express();

app.use((req, res, next) => {
   console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
       headers: req.headers,
       query: req.query,
       body: req.body,
       env: process.env.NODE_ENV
   });
   next();
});

// Middleware
app.use(cors({
   origin: process.env.NODE_ENV === 'production' 
       ? process.env.FRONTEND_URL 
       : 'http://localhost:5173',
   credentials: true,
   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
   allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use(session({
   secret: process.env.JWT_SECRET,
   resave: false,
   saveUninitialized: false,
   cookie: {
       secure: process.env.NODE_ENV === 'production',
       httpOnly: true,
       maxAge: 24 * 60 * 60 * 1000 // 24 hours
   }
}));

// Request logging middleware
app.use((req, res, next) => {
   const start = Date.now();
   console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`, {
       query: req.query,
       body: req.body,
       headers: req.headers
   });
   
   res.on('finish', () => {
       const duration = Date.now() - start;
       console.log(`${new Date().toISOString()} - Completed ${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
   });
   
   next();
});

// Health check route
app.get('/api/health', (req, res) => {
   res.json({ 
       status: 'healthy',
       timestamp: new Date(),
       environment: process.env.NODE_ENV
   });
});

// API routes - place before static files
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

// Serve frontend static files in production - after API routes
if (process.env.NODE_ENV === 'production') {
   // Serve static files
   app.use(express.static(path.join(__dirname, '../../frontend/dist')));
   
   // Handle client routing - must be after API routes
   app.get('*', (req, res) => {
       res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
   });
}

// Error handling middleware
app.use((err, req, res, next) => {
   console.error('Error:', err);
   console.error('Stack:', err.stack);
   res.status(500).json({
       message: 'Something went wrong!',
       error: process.env.NODE_ENV === 'development' ? err.message : {}
   });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
   console.log(`Server running on port ${PORT}`);
   console.log(`Environment: ${process.env.NODE_ENV}`);
   console.log(`App URL: ${process.env.FRONTEND_URL}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
   console.error('Uncaught Exception:', err);
   process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
   console.error('Unhandled Rejection:', err);
   process.exit(1);
});

module.exports = app;