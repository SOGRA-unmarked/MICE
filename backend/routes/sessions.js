const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');
const { isAttendee } = require('../middleware/rbac');
const NodeCache = require('node-cache');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const prisma = new PrismaClient();

// 동적 QR 토큰 캐시 (TTL: 60초)
const qrTokenCache = new NodeCache({ stdTTL: 60 });

/**
 * GET /api/sessions
 * 전체 세션 목록 조회 (모든 인증된 사용자)
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      include: {
        speaker: {
          select: {
            id: true,
            name: true,
            organization: true
          }
        },
        _count: {
          select: {
            attendanceLogs: true,
            questions: true
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
 * GET /api/sessions/:id
 * 세션 상세 조회
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        speaker: {
          select: {
            id: true,
            name: true,
            email: true,
            organization: true
          }
        },
        materials: {
          select: {
            id: true,
            originalFileName: true,
            createdAt: true
          }
        },
        questions: {
          include: {
            attendee: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            attendanceLogs: true
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({
        error: { message: 'Session not found' }
      });
    }

    // 현재 사용자의 즐겨찾기 여부 확인
    const isFavorited = await prisma.favorite.findUnique({
      where: {
        userId_sessionId: {
          userId: req.user.userId,
          sessionId: sessionId
        }
      }
    });

    res.json({
      session: {
        ...session,
        isFavorited: !!isFavorited
      }
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch session' }
    });
  }
});

/**
 * POST /api/sessions/:id/questions
 * 세션에 질문 등록 (참가자)
 */
router.post('/:id/questions', authMiddleware, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const { questionText } = req.body;

    if (!questionText || questionText.trim() === '') {
      return res.status(400).json({
        error: { message: 'Question text is required' }
      });
    }

    // 세션 존재 여부 확인
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return res.status(404).json({
        error: { message: 'Session not found' }
      });
    }

    // 질문 생성
    const question = await prisma.question.create({
      data: {
        sessionId,
        attendeeId: req.user.userId,
        questionText
      },
      include: {
        attendee: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Question submitted successfully',
      question
    });
  } catch (error) {
    console.error('Submit question error:', error);
    res.status(500).json({
      error: { message: 'Failed to submit question' }
    });
  }
});

/**
 * POST /api/sessions/:id/favorite
 * 세션 즐겨찾기 추가
 */
router.post('/:id/favorite', authMiddleware, async (req, res) => {
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

    // 즐겨찾기 추가
    const favorite = await prisma.favorite.create({
      data: {
        userId: req.user.userId,
        sessionId
      }
    });

    res.status(201).json({
      message: 'Session added to favorites',
      favorite
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: { message: 'Session already in favorites' }
      });
    }
    console.error('Add favorite error:', error);
    res.status(500).json({
      error: { message: 'Failed to add favorite' }
    });
  }
});

/**
 * DELETE /api/sessions/:id/favorite
 * 세션 즐겨찾기 제거
 */
router.delete('/:id/favorite', authMiddleware, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);

    await prisma.favorite.delete({
      where: {
        userId_sessionId: {
          userId: req.user.userId,
          sessionId
        }
      }
    });

    res.json({ message: 'Session removed from favorites' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({
      error: { message: 'Failed to remove favorite' }
    });
  }
});

/**
 * GET /api/sessions/:id/material
 * 세션 자료 다운로드
 */
router.get('/:id/material', authMiddleware, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);

    const material = await prisma.sessionMaterial.findFirst({
      where: { sessionId }
    });

    if (!material) {
      return res.status(404).json({
        error: { message: 'Material not found' }
      });
    }

    const filePath = path.join(__dirname, '..', 'uploads', material.storedFileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: { message: 'File not found on server' }
      });
    }

    res.download(filePath, material.originalFileName);
  } catch (error) {
    console.error('Download material error:', error);
    res.status(500).json({
      error: { message: 'Failed to download material' }
    });
  }
});

/**
 * POST /api/sessions/check-in
 * 세션 출석 체크 (동적 QR 스캔)
 */
router.post('/check-in', authMiddleware, isAttendee, async (req, res) => {
  try {
    const { dynamicToken } = req.body;

    if (!dynamicToken) {
      return res.status(400).json({
        error: { message: 'Dynamic token is required' }
      });
    }

    // 캐시에서 토큰 검증
    const sessionId = qrTokenCache.get(dynamicToken);

    if (!sessionId) {
      return res.status(400).json({
        error: { message: 'Invalid or expired QR code' }
      });
    }

    // 출석 로그 생성 (중복 방지)
    const attendanceLog = await prisma.attendanceLog.create({
      data: {
        userId: req.user.userId,
        sessionId: parseInt(sessionId)
      }
    });

    res.status(201).json({
      message: 'Check-in successful',
      attendanceLog
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: { message: 'Already checked in to this session' }
      });
    }
    console.error('Check-in error:', error);
    res.status(500).json({
      error: { message: 'Failed to check in' }
    });
  }
});

// QR 토큰 캐시를 라우터 외부에서 접근할 수 있도록 export
router.qrTokenCache = qrTokenCache;

module.exports = router;
