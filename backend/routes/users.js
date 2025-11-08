const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/users/me
 * 현재 로그인한 사용자 정보 조회
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organization: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found' }
      });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch user' }
    });
  }
});

module.exports = router;
