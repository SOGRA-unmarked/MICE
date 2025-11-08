const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');
const { isSpeaker } = require('../middleware/rbac');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const router = express.Router();
const prisma = new PrismaClient();

// uploads 디렉토리가 없으면 생성
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer 설정 (파일 업로드)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  // 허용된 파일 확장자 및 MIME type (whitelist)
  const allowedExtensions = ['.pdf', '.ppt', '.pptx', '.doc', '.docx'];
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype;

  // 확장자와 MIME type 모두 검증
  if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(mimeType)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, PPT, PPTX, DOC, DOCX are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB 제한
});

/**
 * GET /api/speaker/my-sessions
 * 연사 본인의 세션 목록 조회
 */
router.get('/my-sessions', authMiddleware, isSpeaker, async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      where: {
        speakerId: req.user.userId
      },
      include: {
        materials: {
          select: {
            id: true,
            originalFileName: true,
            createdAt: true
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
    console.error('Get my sessions error:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch sessions' }
    });
  }
});

/**
 * GET /api/speaker/sessions/:id/questions
 * 연사 본인 세션의 Q&A 목록 조회
 */
router.get('/sessions/:id/questions', authMiddleware, isSpeaker, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);

    // 세션이 본인 것인지 확인
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return res.status(404).json({
        error: { message: 'Session not found' }
      });
    }

    if (session.speakerId !== req.user.userId) {
      return res.status(403).json({
        error: { message: 'You can only view questions for your own sessions' }
      });
    }

    // Q&A 목록 조회
    const questions = await prisma.question.findMany({
      where: { sessionId },
      include: {
        attendee: {
          select: {
            id: true,
            name: true,
            organization: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ questions });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch questions' }
    });
  }
});

/**
 * POST /api/speaker/sessions/:id/material
 * 연사 본인 세션에 발표 자료 업로드
 */
router.post('/sessions/:id/material', authMiddleware, isSpeaker, upload.single('file'), async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);

    if (!req.file) {
      return res.status(400).json({
        error: { message: 'File is required' }
      });
    }

    // 세션이 본인 것인지 확인
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      // 파일 삭제
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        error: { message: 'Session not found' }
      });
    }

    if (session.speakerId !== req.user.userId) {
      // 파일 삭제
      fs.unlinkSync(req.file.path);
      return res.status(403).json({
        error: { message: 'You can only upload materials for your own sessions' }
      });
    }

    // 기존 자료가 있으면 삭제
    const existingMaterial = await prisma.sessionMaterial.findFirst({
      where: { sessionId }
    });

    if (existingMaterial) {
      const oldFilePath = path.join(uploadsDir, existingMaterial.storedFileName);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
      await prisma.sessionMaterial.delete({
        where: { id: existingMaterial.id }
      });
    }

    // 새 자료 등록
    const material = await prisma.sessionMaterial.create({
      data: {
        sessionId,
        originalFileName: req.file.originalname,
        storedFileName: req.file.filename,
        uploaderId: req.user.userId
      }
    });

    res.status(201).json({
      message: 'Material uploaded successfully',
      material: {
        id: material.id,
        originalFileName: material.originalFileName,
        createdAt: material.createdAt
      }
    });
  } catch (error) {
    // 에러 발생 시 업로드된 파일 삭제
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Upload material error:', error);
    res.status(500).json({
      error: { message: 'Failed to upload material' }
    });
  }
});

module.exports = router;
