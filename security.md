# MICE 프로젝트 보안 취약점 분석 및 개선 방안

이 문서는 MICE 행사 관리 시스템의 보안 취약점을 분석하고, 각 취약점에 대한 해결 방안을 제시합니다.

## 목차

1. [XSS (Cross-Site Scripting)](#1-xss-cross-site-scripting)
2. [SQL Injection](#2-sql-injection)
3. [인증 및 인가 취약점](#3-인증-및-인가-취약점)
4. [파일 업로드 취약점](#4-파일-업로드-취약점)
5. [Rate Limiting 부재](#5-rate-limiting-부재)
6. [Input Validation 부족](#6-input-validation-부족)
7. [CSRF (Cross-Site Request Forgery)](#7-csrf-cross-site-request-forgery)
8. [민감 정보 노출](#8-민감-정보-노출)
9. [Path Traversal](#9-path-traversal)
10. [CORS 설정](#10-cors-설정)
11. [기타 보안 권장사항](#11-기타-보안-권장사항)

---

## 1. XSS (Cross-Site Scripting)

### 취약점 위치
**파일**: `frontend/src/pages/attendee/SessionDetail.jsx`

**문제점**:
```jsx
// Line 158
<p className="text-gray-700 mb-6 whitespace-pre-wrap">{session.description}</p>

// Line 228
<p className="text-gray-700">{q.questionText}</p>
```

사용자가 입력한 데이터(`questionText`, `session.description`)를 검증 없이 렌더링하고 있습니다. React는 기본적으로 XSS를 방지하지만, 명시적인 sanitization이 없으면 복잡한 공격 패턴에 취약할 수 있습니다.

### 공격 시나리오
1. 악의적인 사용자가 질문 등록 시 스크립트 태그를 포함한 텍스트 입력
2. 관리자나 다른 참가자가 해당 질문을 조회할 때 스크립트 실행 가능성

### 해결 방안

#### Backend (권장)
```javascript
// backend/routes/sessions.js
const validator = require('validator');

router.post('/:id/questions', authMiddleware, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    let { questionText } = req.body;

    // XSS 방지: HTML 태그 제거
    questionText = validator.escape(questionText);

    // 또는 DOMPurify 사용 (더 강력한 sanitization)
    // questionText = DOMPurify.sanitize(questionText);

    if (!questionText || questionText.trim() === '') {
      return res.status(400).json({
        error: { message: 'Question text is required' }
      });
    }

    // 길이 제한 추가
    if (questionText.length > 1000) {
      return res.status(400).json({
        error: { message: 'Question text is too long (max 1000 characters)' }
      });
    }

    // ... 나머지 코드
  }
});
```

#### 설치 필요 패키지
```bash
cd backend
npm install validator
# 또는 더 강력한 sanitization을 원한다면
npm install isomorphic-dompurify
```

#### Frontend (추가 방어)
```jsx
// frontend에서도 DOMPurify 사용 가능
import DOMPurify from 'dompurify';

// SessionDetail.jsx
<p className="text-gray-700 mb-6 whitespace-pre-wrap">
  {DOMPurify.sanitize(session.description)}
</p>
```

---

## 2. SQL Injection

### 현재 상태
**위치**: 모든 데이터베이스 쿼리

**양호한 점**:
- Prisma ORM을 사용하여 parameterized queries를 자동으로 생성
- 직접적인 SQL Injection 위험은 낮음

**잠재적 위험**:
```javascript
// 만약 이런 코드가 있다면 위험 (현재 프로젝트에는 없음)
await prisma.$queryRaw`SELECT * FROM users WHERE email = ${userInput}`
```

### 해결 방안
현재 프로젝트는 Prisma ORM을 올바르게 사용하고 있어 SQL Injection에 대해 안전합니다. 다만 다음 사항을 주의해야 합니다:

1. **절대 사용하지 말 것**:
   - `$queryRaw` 또는 `$executeRaw`에 직접 문자열 보간
   - 동적 SQL 쿼리 생성

2. **권장 사항**:
   ```javascript
   // ❌ 위험
   await prisma.$queryRaw`SELECT * FROM users WHERE id = ${userId}`

   // ✅ 안전
   await prisma.user.findUnique({ where: { id: userId } })

   // ✅ Raw query가 필요한 경우
   await prisma.$queryRaw`SELECT * FROM users WHERE id = ${Prisma.sql`${userId}`}`
   ```

---

## 3. 인증 및 인가 취약점

### 3.1 JWT 토큰을 localStorage에 저장

**파일**: `frontend/src/config/api.js:16`, `frontend/src/context/AuthContext.jsx`

**문제점**:
```javascript
// localStorage에 토큰 저장
const token = localStorage.getItem('token')
```

XSS 공격 성공 시 토큰 탈취 가능

### 해결 방안

#### Option 1: httpOnly 쿠키 사용 (권장)

**Backend 수정**:
```javascript
// backend/routes/auth.js
router.post('/login', async (req, res) => {
  // ... 인증 로직

  // 쿠키로 토큰 전송
  res.cookie('token', token, {
    httpOnly: true,  // JavaScript로 접근 불가
    secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
    sameSite: 'strict',  // CSRF 방지
    maxAge: 7 * 24 * 60 * 60 * 1000  // 7일
  });

  res.json({
    message: 'Login successful',
    user: userWithoutPassword
  });
});
```

**설치 필요 패키지**:
```bash
cd backend
npm install cookie-parser
```

**server.js 수정**:
```javascript
const cookieParser = require('cookie-parser');
app.use(cookieParser());
```

**middleware/auth.js 수정**:
```javascript
const authMiddleware = (req, res, next) => {
  try {
    // 쿠키에서 토큰 추출
    const token = req.cookies.token || req.headers.authorization?.substring(7);

    if (!token) {
      return res.status(401).json({
        error: { message: 'No token provided' }
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email
    };

    next();
  } catch (error) {
    // ... 에러 처리
  }
};
```

#### Option 2: localStorage 사용 시 추가 보안 강화
- XSS 방지를 위한 CSP (Content Security Policy) 헤더 설정
- 짧은 토큰 유효 기간 + Refresh Token 패턴

### 3.2 토큰 무효화 메커니즘 부재

**문제점**:
로그아웃 시 클라이언트에서만 토큰을 삭제하며, 서버에서 토큰을 무효화하지 않음

### 해결 방안

#### Redis를 이용한 토큰 블랙리스트 구현

```bash
cd backend
npm install redis ioredis
```

```javascript
// backend/utils/redis.js
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

module.exports = redis;
```

```javascript
// backend/routes/auth.js
const redis = require('../utils/redis');

router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const token = req.headers.authorization.substring(7);

    // 토큰의 남은 유효 시간 계산
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);

    // 블랙리스트에 추가
    await redis.setex(`blacklist:${token}`, expiresIn, 'true');

    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ error: { message: 'Logout failed' } });
  }
});
```

```javascript
// backend/middleware/auth.js 수정
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.substring(7);

    // 블랙리스트 확인
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({
        error: { message: 'Token has been revoked' }
      });
    }

    // ... 나머지 검증 로직
  } catch (error) {
    // ... 에러 처리
  }
};
```

### 3.3 JWT Secret 관리

**확인 필요**:
- `.env` 파일이 `.gitignore`에 포함되어 있는지 확인
- `JWT_SECRET`이 충분히 강력한지 확인 (최소 32자 이상의 랜덤 문자열)

**권장 Secret 생성 방법**:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 4. 파일 업로드 취약점

### 4.1 MIME Type 검증 부재

**파일**: `backend/routes/speaker.js:31-41`

**문제점**:
```javascript
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.ppt', '.pptx', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type...'));
  }
};
```

파일 확장자만 검증하고 있어, 악의적인 파일의 확장자를 변경하여 업로드 가능

### 해결 방안

```javascript
// backend/routes/speaker.js
const fileFilter = (req, file, cb) => {
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

  if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(mimeType)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, PPT, PPTX, DOC, DOCX are allowed.'));
  }
};
```

### 4.2 업로드된 파일 직접 서빙

**파일**: `backend/server.js:28`

**문제점**:
```javascript
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```

업로드된 파일을 직접 static으로 서빙하면, 악성 스크립트가 포함된 HTML 파일 등이 실행될 수 있음

### 해결 방안

#### Option 1: Content-Disposition 헤더 설정
```javascript
// backend/server.js
app.use('/uploads', (req, res, next) => {
  res.setHeader('Content-Disposition', 'attachment');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
}, express.static(path.join(__dirname, 'uploads')));
```

#### Option 2: 전용 다운로드 API 사용 (권장 - 이미 구현됨)
현재 `GET /api/sessions/:id/material` API를 사용하고 있으므로, `/uploads` static 서빙을 제거하는 것을 권장합니다.

```javascript
// backend/server.js에서 제거
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```

### 4.3 파일 스캔 부재

**권장 사항**:
바이러스 스캔을 위한 ClamAV 통합

```bash
npm install clamscan
```

```javascript
// backend/utils/virusScanner.js
const NodeClam = require('clamscan');

const initScanner = async () => {
  return new NodeClam().init({
    clamdscan: {
      host: process.env.CLAM_HOST || 'localhost',
      port: process.env.CLAM_PORT || 3310
    }
  });
};

module.exports = initScanner;
```

```javascript
// backend/routes/speaker.js
const initScanner = require('../utils/virusScanner');

router.post('/sessions/:id/material', authMiddleware, isSpeaker, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: { message: 'File is required' }
      });
    }

    // 바이러스 스캔
    const clamscan = await initScanner();
    const { isInfected, viruses } = await clamscan.scanFile(req.file.path);

    if (isInfected) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error: { message: `File is infected: ${viruses.join(', ')}` }
      });
    }

    // ... 나머지 코드
  } catch (error) {
    // ... 에러 처리
  }
});
```

---

## 5. Rate Limiting 부재

### 문제점
**전체 엔드포인트**에서 Rate Limiting이 없어 다음 공격에 취약:
- 브루트포스 공격 (로그인 시도 무제한)
- DDoS 공격
- 자동화된 스팸 (질문 도배 등)

### 해결 방안

```bash
cd backend
npm install express-rate-limit
```

```javascript
// backend/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

// 일반 API용
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 15분당 최대 100개 요청
  message: {
    error: { message: 'Too many requests, please try again later.' }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 로그인/회원가입용 (더 엄격)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 5, // 15분당 최대 5번 시도
  message: {
    error: { message: 'Too many login attempts, please try again after 15 minutes.' }
  },
  skipSuccessfulRequests: true // 성공한 요청은 카운트하지 않음
});

// 질문 등록용
const questionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: 20, // 1시간당 최대 20개 질문
  message: {
    error: { message: 'Too many questions submitted, please try again later.' }
  }
});

module.exports = { apiLimiter, authLimiter, questionLimiter };
```

```javascript
// backend/server.js
const { apiLimiter } = require('./middleware/rateLimiter');

// 모든 API에 적용
app.use('/api/', apiLimiter);
```

```javascript
// backend/routes/auth.js
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/login', authLimiter, async (req, res) => {
  // ... 로그인 로직
});

router.post('/register', authLimiter, async (req, res) => {
  // ... 회원가입 로직
});
```

```javascript
// backend/routes/sessions.js
const { questionLimiter } = require('../middleware/rateLimiter');

router.post('/:id/questions', authMiddleware, questionLimiter, async (req, res) => {
  // ... 질문 등록 로직
});
```

---

## 6. Input Validation 부족

### 6.1 이메일 형식 검증

**파일**: `backend/routes/auth.js:13-22`

**문제점**:
```javascript
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role, organization } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        error: { message: 'Email, password, and name are required' }
      });
    }
    // 이메일 형식 검증 없음
```

### 해결 방안

```javascript
const validator = require('validator');

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role, organization } = req.body;

    // 필수 필드 검증
    if (!email || !password || !name) {
      return res.status(400).json({
        error: { message: 'Email, password, and name are required' }
      });
    }

    // 이메일 형식 검증
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        error: { message: 'Invalid email format' }
      });
    }

    // 비밀번호 강도 검증
    if (password.length < 8) {
      return res.status(400).json({
        error: { message: 'Password must be at least 8 characters long' }
      });
    }

    // 이름 길이 검증
    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({
        error: { message: 'Name must be between 2 and 100 characters' }
      });
    }

    // Role 검증
    const validRoles = ['ADMIN', 'SPEAKER', 'ATTENDEE'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        error: { message: 'Invalid role' }
      });
    }

    // ... 나머지 코드
  }
});
```

### 6.2 범용 Validation 미들웨어 구축

```bash
npm install express-validator
```

```javascript
// backend/middleware/validators.js
const { body, param, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        details: errors.array()
      }
    });
  }
  next();
};

const registerValidator = [
  body('email')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .escape(),
  body('role')
    .optional()
    .isIn(['ADMIN', 'SPEAKER', 'ATTENDEE']).withMessage('Invalid role'),
  body('organization')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Organization name is too long')
    .escape(),
  validate
];

const questionValidator = [
  param('id').isInt().withMessage('Invalid session ID'),
  body('questionText')
    .trim()
    .notEmpty().withMessage('Question text is required')
    .isLength({ max: 1000 }).withMessage('Question is too long (max 1000 characters)')
    .escape(),
  validate
];

const sessionValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title is too long'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 5000 }).withMessage('Description is too long'),
  body('startTime')
    .isISO8601().withMessage('Invalid start time format'),
  body('endTime')
    .isISO8601().withMessage('Invalid end time format')
    .custom((endTime, { req }) => {
      if (new Date(endTime) <= new Date(req.body.startTime)) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
  body('speakerId')
    .isInt().withMessage('Invalid speaker ID'),
  validate
];

module.exports = {
  registerValidator,
  questionValidator,
  sessionValidator
};
```

**사용 예**:
```javascript
// backend/routes/auth.js
const { registerValidator } = require('../middleware/validators');

router.post('/register', registerValidator, async (req, res) => {
  // validation이 통과된 경우에만 실행됨
});
```

---

## 7. CSRF (Cross-Site Request Forgery)

### 문제점
**파일**: `backend/server.js:18-22`

```javascript
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,  // ⚠️ CSRF 공격에 취약
  optionsSuccessStatus: 200
};
```

`credentials: true`로 설정되어 있지만 CSRF 토큰이 없음

### 해결 방안

#### Option 1: CSRF 토큰 사용

```bash
cd backend
npm install csurf
```

```javascript
// backend/server.js
const csrf = require('csurf');
const cookieParser = require('cookie-parser');

app.use(cookieParser());

// CSRF 보호 활성화
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// GET 요청에 CSRF 토큰 제공
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// POST, PUT, DELETE 요청에 CSRF 보호 적용
app.use('/api', (req, res, next) => {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return csrfProtection(req, res, next);
  }
  next();
});
```

**Frontend 수정**:
```javascript
// frontend/src/config/api.js
import axios from 'axios'

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true  // 쿠키 전송 활성화
})

// CSRF 토큰 가져오기 및 자동 추가
let csrfToken = null;

const getCsrfToken = async () => {
  if (!csrfToken) {
    const response = await axios.get(`${API_URL}/csrf-token`, {
      withCredentials: true
    });
    csrfToken = response.data.csrfToken;
  }
  return csrfToken;
};

api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // POST, PUT, DELETE 요청에 CSRF 토큰 추가
    if (['post', 'put', 'delete'].includes(config.method)) {
      const csrf = await getCsrfToken();
      config.headers['X-CSRF-Token'] = csrf;
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)
```

#### Option 2: SameSite Cookie 속성 사용 (간단한 방법)

```javascript
// backend/routes/auth.js
res.cookie('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',  // CSRF 방지
  maxAge: 7 * 24 * 60 * 60 * 1000
});
```

---

## 8. 민감 정보 노출

### 8.1 에러 메시지 상세 정보 노출

**파일**: `backend/server.js:43-51`

**문제점**:
```javascript
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});
```

개발 환경에서 스택 트레이스 노출은 괜찮지만, `err.message`가 프로덕션에서도 노출됨

### 해결 방안

```javascript
// backend/server.js
app.use((err, req, res, next) => {
  console.error(err.stack);

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
```

### 8.2 환경 변수 노출 방지

**확인 사항**:
```bash
# .gitignore에 다음 항목이 있는지 확인
.env
.env.local
.env.production
```

**권장 .env.example 생성**:
```bash
# backend/.env.example
DATABASE_URL=postgresql://user:password@localhost:5432/mice_db
JWT_SECRET=your-secret-key-here-min-32-chars
PORT=5050
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### 8.3 로그에 민감 정보 포함 방지

```javascript
// backend/routes/auth.js
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // ❌ 나쁜 예
    console.log('Login attempt:', { email, password });

    // ✅ 좋은 예
    console.log('Login attempt:', { email });

    // ... 나머지 코드
  }
});
```

---

## 9. Path Traversal

### 문제점
**파일**: `backend/routes/sessions.js:271-279`

```javascript
router.get('/:id/material', authMiddleware, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);

    const material = await prisma.sessionMaterial.findFirst({
      where: { sessionId }
    });

    const filePath = path.join(__dirname, '..', 'uploads', material.storedFileName);

    // filePath가 uploads 디렉토리 밖을 가리킬 수 있음
```

### 해결 방안

```javascript
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

    // Path Traversal 방지
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const filePath = path.join(uploadsDir, path.basename(material.storedFileName));

    // 경로가 uploads 디렉토리 내부인지 확인
    if (!filePath.startsWith(uploadsDir)) {
      return res.status(403).json({
        error: { message: 'Access denied' }
      });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: { message: 'File not found on server' }
      });
    }

    // Content-Type 헤더 설정
    const ext = path.extname(material.originalFileName).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };

    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${material.originalFileName}"`);

    res.download(filePath, material.originalFileName);
  } catch (error) {
    console.error('Download material error:', error);
    res.status(500).json({
      error: { message: 'Failed to download material' }
    });
  }
});
```

---

## 10. CORS 설정

### 현재 상태
**파일**: `backend/server.js:18-22`

```javascript
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
```

### 권장 개선사항

```javascript
// backend/server.js
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000'];

const corsOptions = {
  origin: (origin, callback) => {
    // origin이 없는 경우 허용 (모바일 앱, Postman 등)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
};
```

**환경 변수**:
```bash
# .env
ALLOWED_ORIGINS=http://localhost:3000,https://mice-orcin.vercel.app
```

---

## 11. 기타 보안 권장사항

### 11.1 보안 헤더 설정

```bash
cd backend
npm install helmet
```

```javascript
// backend/server.js
const helmet = require('helmet');

// 보안 헤더 설정
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
```

### 11.2 비밀번호 정책 강화

**현재**: `bcrypt.hash(password, 10)` - 적절함

**권장 추가 사항**:
- 최소 8자 이상
- 대문자, 소문자, 숫자, 특수문자 조합
- 일반적인 비밀번호 (123456, password 등) 차단

```javascript
const commonPasswords = ['password', '123456', '12345678', 'qwerty', 'abc123'];

router.post('/register', async (req, res) => {
  const { password } = req.body;

  // 일반적인 비밀번호 체크
  if (commonPasswords.includes(password.toLowerCase())) {
    return res.status(400).json({
      error: { message: 'Password is too common' }
    });
  }

  // 복잡도 체크
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      error: {
        message: 'Password must be at least 8 characters and contain uppercase, lowercase, number, and special character'
      }
    });
  }

  // ... 나머지 코드
});
```

### 11.3 Brute Force 공격 방지 (계정 잠금)

```javascript
// backend/utils/loginAttempts.js
const loginAttempts = new Map();

const MAX_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15분

const recordFailedAttempt = (email) => {
  const attempts = loginAttempts.get(email) || { count: 0, lockedUntil: null };
  attempts.count += 1;

  if (attempts.count >= MAX_ATTEMPTS) {
    attempts.lockedUntil = Date.now() + LOCK_TIME;
  }

  loginAttempts.set(email, attempts);
};

const isAccountLocked = (email) => {
  const attempts = loginAttempts.get(email);

  if (!attempts) return false;

  if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
    return true;
  }

  // 잠금 시간이 지났으면 초기화
  if (attempts.lockedUntil && Date.now() >= attempts.lockedUntil) {
    loginAttempts.delete(email);
    return false;
  }

  return false;
};

const resetAttempts = (email) => {
  loginAttempts.delete(email);
};

module.exports = { recordFailedAttempt, isAccountLocked, resetAttempts };
```

```javascript
// backend/routes/auth.js
const { recordFailedAttempt, isAccountLocked, resetAttempts } = require('../utils/loginAttempts');

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 계정 잠금 확인
    if (isAccountLocked(email)) {
      return res.status(429).json({
        error: { message: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.' }
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      recordFailedAttempt(email);
      return res.status(401).json({
        error: { message: 'Invalid email or password' }
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      recordFailedAttempt(email);
      return res.status(401).json({
        error: { message: 'Invalid email or password' }
      });
    }

    // 로그인 성공 - 시도 기록 초기화
    resetAttempts(email);

    // ... JWT 토큰 생성 및 반환
  } catch (error) {
    // ... 에러 처리
  }
});
```

### 11.4 Database Connection Pooling 설정

```javascript
// backend/prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["metrics"]
}
```

```javascript
// backend/utils/prisma.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  // Connection pool 설정
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

module.exports = prisma;
```

### 11.5 HTTPS 강제 (프로덕션)

```javascript
// backend/middleware/httpsRedirect.js
const httpsRedirect = (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
};

module.exports = httpsRedirect;
```

```javascript
// backend/server.js
const httpsRedirect = require('./middleware/httpsRedirect');

if (process.env.NODE_ENV === 'production') {
  app.use(httpsRedirect);
}
```

### 11.6 정기적인 의존성 업데이트 및 보안 감사

```bash
# 보안 취약점 스캔
npm audit

# 자동 수정 (가능한 경우)
npm audit fix

# 강제 수정 (breaking changes 포함)
npm audit fix --force
```

**권장 사항**:
- 매주 또는 매월 정기적으로 `npm audit` 실행
- Dependabot 또는 Renovate Bot 설정하여 자동 업데이트

### 11.7 로깅 및 모니터링

```bash
npm install winston
```

```javascript
// backend/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

module.exports = logger;
```

**사용 예**:
```javascript
// backend/routes/auth.js
const logger = require('../utils/logger');

router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;

    logger.info('Login attempt', { email, ip: req.ip });

    // ... 로그인 로직

    logger.info('Login successful', { email, userId: user.id });
  } catch (error) {
    logger.error('Login failed', { error: error.message, email: req.body.email });
  }
});
```

---

## 우선순위별 적용 순서

보안 개선 작업의 우선순위를 다음과 같이 제안합니다:

### 높음 (즉시 적용 권장)
1. **Rate Limiting** - DDoS 및 브루트포스 공격 방지
2. **Input Validation** - XSS 및 Injection 공격 방지
3. **보안 헤더 (Helmet)** - 다양한 웹 취약점 방지
4. **JWT 저장 방식 개선** - httpOnly 쿠키 사용
5. **파일 업로드 검증 강화** - MIME type 검증

### 중간 (1-2주 내 적용)
6. **CSRF 보호** - CSRF 토큰 또는 SameSite 쿠키
7. **에러 메시지 개선** - 민감 정보 노출 방지
8. **Path Traversal 방지** - 파일 다운로드 보안
9. **비밀번호 정책 강화** - 복잡도 요구사항 추가
10. **로깅 시스템** - 보안 이벤트 추적

### 낮음 (장기 개선 사항)
11. **토큰 무효화 메커니즘** - Redis 블랙리스트
12. **파일 바이러스 스캔** - ClamAV 통합
13. **정기적인 보안 감사** - 의존성 업데이트 자동화

---

## 참고 자료

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Prisma Security Documentation](https://www.prisma.io/docs/concepts/components/prisma-client/security)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

**문서 버전**: 1.0
**작성일**: 2025-11-09
**마지막 업데이트**: 2025-11-09
