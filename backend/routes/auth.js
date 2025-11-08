const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/auth/register
 * 회원가입 (해커톤에서는 Admin이 사용자를 생성하는 용도로 사용)
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role, organization } = req.body;

    // 필수 필드 검증
    if (!email || !password || !name) {
      return res.status(400).json({
        error: { message: 'Email, password, and name are required' }
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

    res.status(201).json({
      message: 'User created successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      error: { message: 'Failed to create user' }
    });
  }
});

/**
 * POST /api/auth/login
 * 로그인
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 필수 필드 검증
    if (!email || !password) {
      return res.status(400).json({
        error: { message: 'Email and password are required' }
      });
    }

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        error: { message: 'Invalid email or password' }
      });
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: { message: 'Invalid email or password' }
      });
    }

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

    // 비밀번호 해시 제거 후 응답
    const { passwordHash: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: { message: 'Login failed' }
    });
  }
});

module.exports = router;
