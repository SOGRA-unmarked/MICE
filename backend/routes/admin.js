const express = require('express');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');
const { isAdmin } = require('../middleware/rbac');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { eventEntryValidator } = require('../middleware/validators');
const { qrScanLimiter, statsLimiter } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// sessions.js에서 qrTokenCache에 접근하기 위해
const sessionsRouter = require('./sessions');

/**
 * GET /api/admin/users
 * 전체 사용자 목록 조회
 */
router.get('/users', authMiddleware, isAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organization: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch users' }
    });
  }
});

/**
 * POST /api/admin/users
 * 새 사용자 생성
 */
router.post('/users', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { email, password, name, role, organization } = req.body;

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

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: role || 'ATTENDEE',
        organization: organization || null
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organization: true,
        createdAt: true
      }
    });

    res.status(201).json({
      message: 'User created successfully',
      user
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      error: { message: 'Failed to create user' }
    });
  }
});

/**
 * PUT /api/admin/users/:id
 * 사용자 정보 수정
 */
router.put('/users/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { name, role, organization } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(role && { role }),
        ...(organization !== undefined && { organization })
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organization: true,
        createdAt: true
      }
    });

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      error: { message: 'Failed to update user' }
    });
  }
});

/**
 * DELETE /api/admin/users/:id
 * 사용자 삭제
 */
router.delete('/users/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      error: { message: 'Failed to delete user' }
    });
  }
});

/**
 * GET /api/admin/sessions
 * 전체 세션 목록 조회
 */
router.get('/sessions', authMiddleware, isAdmin, async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      include: {
        speaker: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            questions: true,
            attendanceLogs: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    res.json({ sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch sessions' }
    });
  }
});

/**
 * POST /api/admin/sessions
 * 새 세션 생성
 */
router.post('/sessions', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { title, description, startTime, endTime, speakerId, track } = req.body;

    if (!title || !description || !startTime || !endTime || !speakerId) {
      return res.status(400).json({
        error: { message: 'Title, description, startTime, endTime, and speakerId are required' }
      });
    }

    // Speaker 존재 여부 확인
    const speaker = await prisma.user.findUnique({
      where: { id: speakerId }
    });

    if (!speaker || speaker.role !== 'SPEAKER') {
      return res.status(400).json({
        error: { message: 'Invalid speaker ID or user is not a speaker' }
      });
    }

    const session = await prisma.session.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        speakerId,
        track: track || null
      },
      include: {
        speaker: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Session created successfully',
      session
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({
      error: { message: 'Failed to create session' }
    });
  }
});

/**
 * PUT /api/admin/sessions/:id
 * 세션 정보 수정
 */
router.put('/sessions/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const { title, description, startTime, endTime, speakerId, track } = req.body;

    const session = await prisma.session.update({
      where: { id: sessionId },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime && { endTime: new Date(endTime) }),
        ...(speakerId && { speakerId }),
        ...(track !== undefined && { track })
      },
      include: {
        speaker: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      message: 'Session updated successfully',
      session
    });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({
      error: { message: 'Failed to update session' }
    });
  }
});

/**
 * DELETE /api/admin/sessions/:id
 * 세션 삭제
 */
router.delete('/sessions/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);

    await prisma.session.delete({
      where: { id: sessionId }
    });

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({
      error: { message: 'Failed to delete session' }
    });
  }
});

/**
 * GET /api/admin/sessions/:id/dynamic-qr
 * 세션 동적 QR 코드 생성 (60초 TTL)
 */
router.get('/sessions/:id/dynamic-qr', authMiddleware, isAdmin, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);

    // 세션 존재 여부 확인
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return res.status(404).json({
        error: { message: 'Session not found' }
      });
    }

    // 동적 토큰 생성 (UUID)
    const dynamicToken = uuidv4();

    // 캐시에 저장 (60초 TTL)
    sessionsRouter.qrTokenCache.set(dynamicToken, sessionId, 60);

    res.json({
      sessionId,
      dynamicToken,
      expiresIn: 60,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Generate dynamic QR error:', error);
    res.status(500).json({
      error: { message: 'Failed to generate dynamic QR' }
    });
  }
});

/**
 * GET /api/admin/sessions/:id/attendance
 * 세션 출석 현황 조회
 */
router.get('/sessions/:id/attendance', authMiddleware, isAdmin, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);

    const attendanceLogs = await prisma.attendanceLog.findMany({
      where: { sessionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            organization: true
          }
        }
      },
      orderBy: {
        checkedInAt: 'desc'
      }
    });

    res.json({
      sessionId,
      totalAttendees: attendanceLogs.length,
      attendanceLogs
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch attendance' }
    });
  }
});

/**
 * POST /api/admin/event-entry
 * 참가자 입장 체크인 (관리자가 참가자의 QR을 스캔)
 */
router.post('/event-entry', authMiddleware, isAdmin, qrScanLimiter, eventEntryValidator, async (req, res) => {
  const startTime = Date.now();

  try {
    const { userId } = req.body;
    const adminId = req.user.id;

    // 사용자 존재 및 역할 확인
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        organization: true,
        role: true
      }
    });

    // 최소 지연 시간 보장 (타이밍 공격 방지)
    const minDelay = 100; // 100ms
    const elapsed = Date.now() - startTime;
    if (elapsed < minDelay) {
      await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
    }

    if (!user) {
      logger.warn('Event entry failed - user not found', {
        userId,
        adminId,
        ip: req.ip
      });
      return res.status(400).json({
        error: { message: 'Invalid QR code' }
      });
    }

    // ATTENDEE 역할만 입장 허용
    if (user.role !== 'ATTENDEE') {
      logger.warn('Event entry rejected - invalid role', {
        userId,
        userRole: user.role,
        adminId,
        ip: req.ip
      });
      return res.status(400).json({
        error: { message: 'Invalid QR code' }
      });
    }

    // 이미 입장했는지 확인
    const existingEntry = await prisma.eventEntry.findUnique({
      where: { userId }
    });

    if (existingEntry) {
      logger.info('Event entry - already checked in', {
        userId,
        userName: user.name,
        adminId,
        originalEntryTime: existingEntry.enteredAt
      });

      return res.status(200).json({
        message: 'Already checked in',
        alreadyCheckedIn: true,
        entryTime: existingEntry.enteredAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          organization: user.organization
        }
      });
    }

    // 새로운 입장 기록 생성
    const eventEntry = await prisma.eventEntry.create({
      data: {
        userId
      }
    });

    logger.info('Event entry successful', {
      userId,
      userName: user.name,
      adminId,
      entryTime: eventEntry.enteredAt
    });

    res.status(201).json({
      message: 'Check-in successful',
      alreadyCheckedIn: false,
      entryTime: eventEntry.enteredAt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        organization: user.organization
      }
    });
  } catch (error) {
    logger.error('Event entry error', {
      error: error.message,
      stack: error.stack,
      userId: req.body.userId,
      adminId: req.user?.id
    });

    res.status(500).json({
      error: { message: 'Failed to process event entry' }
    });
  }
});

/**
 * GET /api/admin/event-entry/stats
 * 행사장 입장 통계 조회
 */
router.get('/event-entry/stats', authMiddleware, isAdmin, statsLimiter, async (req, res) => {
  try {
    const totalEntries = await prisma.eventEntry.count();
    const totalAttendees = await prisma.user.count({
      where: { role: 'ATTENDEE' }
    });

    const entries = await prisma.eventEntry.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            organization: true,
            role: true
          }
        }
      },
      orderBy: {
        enteredAt: 'desc'
      }
    });

    logger.info('Event entry stats requested', {
      adminId: req.user.id,
      totalEntries,
      totalAttendees
    });

    res.json({
      totalEntries,
      totalAttendees,
      checkInRate: totalAttendees > 0 ? ((totalEntries / totalAttendees) * 100).toFixed(2) : 0,
      entries
    });
  } catch (error) {
    logger.error('Get event entry stats error', {
      error: error.message,
      adminId: req.user?.id
    });

    res.status(500).json({
      error: { message: 'Failed to fetch event entry stats' }
    });
  }
});

module.exports = router;
