require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const logger = require('./utils/logger');
const { apiLimiter } = require('./middleware/rateLimiter');

// Routes
const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');
const speakerRoutes = require('./routes/speaker');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5050;

// Railway 프록시 신뢰 설정 (X-Forwarded-For 헤더 처리)
app.set('trust proxy', true);

// 보안 헤더 설정 (Helmet)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS 설정 개선 - 여러 origin 지원
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'https://mice-orcin.vercel.app' // 기본 Vercel URL
    ];

const corsOptions = {
  origin: (origin, callback) => {
    // origin이 없는 경우 허용 (모바일 앱, Postman 등)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked origin:', { origin, allowedOrigins });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting - 모든 API 엔드포인트에 적용
app.use('/api/', apiLimiter);

// Static files for uploaded materials - 보안 헤더 추가
app.use('/uploads', (req, res, next) => {
  res.setHeader('Content-Disposition', 'attachment');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/speaker', speakerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'MICE Backend is running' });
});

// Error handling middleware - 민감 정보 노출 방지
app.use((err, req, res, next) => {
  // 로거를 통해 에러 기록
  logger.error('Server error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  // 프로덕션에서는 일반적인 메시지만 노출
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal Server Error'
    : err.message;

  res.status(err.status || 500).json({
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err.message
      })
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: { message: 'Route not found' } });
});

app.listen(PORT, () => {
  logger.info(`🚀 MICE Backend Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔒 Allowed CORS Origins: ${allowedOrigins.join(', ')}`);
  console.log(`🚀 MICE Backend Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 Allowed CORS Origins: ${allowedOrigins.join(', ')}`);
});

// Trigger redeploy

