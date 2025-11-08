const rateLimit = require('express-rate-limit');

// 일반 API용 Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 15분당 최대 100개 요청
  message: {
    error: { message: 'Too many requests, please try again later.' }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 로그인/회원가입용 Rate Limiter (더 엄격)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 5, // 15분당 최대 5번 시도
  message: {
    error: { message: 'Too many login attempts, please try again after 15 minutes.' }
  },
  skipSuccessfulRequests: true // 성공한 요청은 카운트하지 않음
});

// 질문 등록용 Rate Limiter
const questionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: 20, // 1시간당 최대 20개 질문
  message: {
    error: { message: 'Too many questions submitted, please try again later.' }
  }
});

module.exports = { apiLimiter, authLimiter, questionLimiter };
