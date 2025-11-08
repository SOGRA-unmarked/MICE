const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { registerValidator, loginValidator } = require('../middleware/validators');
const { authLimiter } = require('../middleware/rateLimiter');
const { recordFailedAttempt, isAccountLocked, resetAttempts } = require('../utils/loginAttempts');
const logger = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// 일반적인 비밀번호 목록 (Brute Force 방지)
const commonPasswords = [
  'password', '123456', '12345678', 'qwerty', 'abc123',
  'password123', '111111', 'letmein', 'admin', 'welcome'
];

/**
 * POST /api/auth/register
 * 회원가입 (해커톤에서는 Admin이 사용자를 생성하는 용도로 사용)
 */
router.post('/register', authLimiter, registerValidator, async (req, res) => {
  try {
    const { email, password, name, role, organization } = req.body;

    // 일반적인 비밀번호 체크
    if (commonPasswords.includes(password.toLowerCase())) {
      return res.status(400).json({
        error: { message: 'Password is too common. Please choose a stronger password.' }
      });
    }

    // 이메일 중복 체크
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        error: { message: 'Email already exists' }
      });
    }

    // 비밀번호 해시
    const passwordHash = await bcrypt.hash(password, 10);

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: role || 'ATTENDEE',
        organization: organization || null
      }
    });

    // 비밀번호 해시 제거 후 응답
    const { passwordHash: _, ...userWithoutPassword } = user;

    logger.info('User registered successfully', { email, userId: user.id });

    res.status(201).json({
      message: 'User created successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    logger.error('Register error:', { error: error.message, email: req.body.email });
    res.status(500).json({
      error: { message: 'Failed to create user' }
    });
  }
});

/**
 * POST /api/auth/login
 * 로그인
 */
router.post('/login', authLimiter, loginValidator, async (req, res) => {
  try {
    const { email, password } = req.body;

    // 계정 잠금 확인 (Brute Force 방지)
    if (isAccountLocked(email)) {
      logger.warn('Login attempt on locked account', { email, ip: req.ip });
      return res.status(429).json({
        error: { message: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.' }
      });
    }

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      recordFailedAttempt(email);
      logger.warn('Login failed - user not found', { email, ip: req.ip });
      return res.status(401).json({
        error: { message: 'Invalid email or password' }
      });
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      recordFailedAttempt(email);
      logger.warn('Login failed - invalid password', { email, ip: req.ip });
      return res.status(401).json({
        error: { message: 'Invalid email or password' }
      });
    }

    // 로그인 성공 - 시도 기록 초기화
    resetAttempts(email);

    // JWT 토큰 생성
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // httpOnly 쿠키로 토큰 전송
    res.cookie('token', token, {
      httpOnly: true,  // JavaScript로 접근 불가
      secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
      sameSite: 'strict',  // CSRF 방지
      maxAge: 7 * 24 * 60 * 60 * 1000  // 7일
    });

    // 비밀번호 해시 제거 후 응답
    const { passwordHash: _, ...userWithoutPassword } = user;

    logger.info('Login successful', { email, userId: user.id, ip: req.ip });

    res.json({
      message: 'Login successful',
      token,  // 프론트엔드 호환성을 위해 토큰도 함께 전송
      user: userWithoutPassword
    });
  } catch (error) {
    logger.error('Login error:', { error: error.message, email: req.body.email });
    res.status(500).json({
      error: { message: 'Login failed' }
    });
  }
});

module.exports = router;
