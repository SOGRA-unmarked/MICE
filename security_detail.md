# MICE 프로젝트 보안 구현 상세 보고서

이 문서는 MICE 행사 관리 시스템에 적용된 주요 보안 기능들을 상세히 설명합니다. 각 보안 위협에 대해 어떤 방식으로 대응하고 있으며, 어느 코드에 해당 기능이 구현되어 있는지 기술합니다.

## 목차

1.  [XSS (Cross-Site Scripting) 방지](#1-xss-cross-site-scripting-방지)
2.  [SQL Injection 방지](#2-sql-injection-방지)
3.  [인증 및 인가 (Authentication & Authorization)](#3-인증-및-인가)
4.  [안전한 파일 업로드](#4-안전한-파일-업로드)
5.  [API 요청 제한 (Rate Limiting)](#5-api-요청-제한-rate-limiting)
6.  [무차별 대입 공격 (Brute Force) 방지](#6-무차별-대입-공격-brute-force-방지)
7.  [CSRF (Cross-Site Request Forgery) 방지](#7-csrf-cross-site-request-forgery-방지)
8.  [경로 조작 (Path Traversal) 방지](#8-경로-조작-path-traversal-방지)
9.  [행사장 입장 관리 보안](#9-행사장-입장-관리-보안)
10. [실시간 데이터 업데이트 보안](#10-실시간-데이터-업데이트-보안)
11. [QR 스캔 보안](#11-qr-스캔-보안)
12. [기타 보안 강화 조치](#12-기타-보안-강화-조치)

---

## 1. XSS (Cross-Site Scripting) 방지

### 문제점
사용자가 입력한 텍스트(이름, 질문 내용 등)에 악성 스크립트가 포함된 경우, 해당 텍스트가 화면에 그대로 렌더링되면서 스크립트가 실행되어 다른 사용자의 세션을 탈취하는 등의 피해가 발생할 수 있습니다.

### 해결 방안
`express-validator` 라이브러리의 `escape()` 기능을 사용하여, 사용자가 입력하는 모든 텍스트 기반 데이터에서 `<`, `>`, `&` 등의 특수 문자를 HTML 엔티티(`&lt;`, `&gt;`, `&amp;`)로 변환합니다. 이로써 악성 스크립트가 브라우저에서 코드로 실행되지 않고, 안전한 텍스트로만 표시되도록 조치했습니다.

-   **적용된 파일**: `backend/middleware/validators.js`
-   **상세 코드**:
    ```javascript
    // 예시: 질문 등록 Validator
    const questionValidator = [
      // ...
      body('questionText')
        .trim()
        .notEmpty().withMessage('Question text is required')
        .isLength({ max: 1000 }).withMessage('Question is too long (max 1000 characters)')
        .escape(), // <--- 이 부분에서 XSS 방지 처리
      validate
    ];

    // 사용자 이름, 세션 제목 등 다른 입력값에도 동일하게 적용
    ```

## 2. SQL Injection 방지

### 문제점
사용자 입력값을 검증 없이 그대로 데이터베이스 쿼리에 사용할 경우, 공격자가 악의적인 SQL 구문을 삽입하여 데이터베이스를 조작하거나 정보를 탈취할 수 있습니다.

### 해결 방안
데이터베이스와의 모든 상호작용에 **Prisma ORM**을 사용합니다. Prisma는 모든 쿼리를 'parameterized query' 방식으로 처리하므로, 사용자 입력값이 실제 SQL 구문이 아닌 데이터(파라미터)로만 안전하게 전달됩니다. 이를 통해 SQL Injection 공격을 원천적으로 방지합니다.

-   **적용된 파일**: `backend/routes/` 디렉토리의 모든 파일 (e.g., `auth.js`, `sessions.js`)
-   **상세 코드**:
    ```javascript
    // 예시: 로그인 시 사용자 조회
    // 사용자가 입력한 email이 SQL 구문으로 해석되지 않고, 안전한 값으로 전달됨
    const user = await prisma.user.findUnique({
      where: { email }
    });
    ```

## 3. 인증 및 인가

### 문제점
-   **토큰 탈취**: XSS 공격 등으로 JWT 토큰이 탈취되면 공격자가 정상 사용자로 위장할 수 있습니다.
-   **권한 없는 접근**: 일반 사용자가 관리자 페이지에 접근하는 등 역할에 맞지 않는 기능을 실행할 수 있습니다.

### 해결 방안
#### 3.1. httpOnly 쿠키를 이용한 토큰 관리
로그인 성공 시, JWT 토큰을 JavaScript에서 접근할 수 없는 `httpOnly` 쿠키에 저장하여 전송합니다. 이로써 XSS 공격이 성공하더라도 공격자가 스크립트를 통해 토큰을 탈취하는 것을 방지합니다.

-   **적용된 파일**: `backend/routes/auth.js`
-   **상세 코드**:
    ```javascript
    res.cookie('token', token, {
      httpOnly: true,  // JavaScript로 접근 불가
      secure: process.env.NODE_ENV === 'production', // 프로덕션 환경에서는 HTTPS로만 전송
      sameSite: 'strict', // CSRF 방지
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7일 유효기간
    });
    ```

#### 3.2. 역할 기반 접근 제어 (RBAC)
사용자 역할을 `ADMIN`, `SPEAKER`, `ATTENDEE`로 나누고, 각 API 엔드포인트마다 접근 가능한 역할을 지정합니다. 인증 미들웨어(`authMiddleware`)가 토큰을 검증하여 사용자 정보를 `req.user`에 담고, RBAC 미들웨어(`isAdmin`, `isSpeaker` 등)가 `req.user.role`을 확인하여 인가된 사용자인지 판별합니다.

-   **적용된 파일**: `backend/middleware/auth.js`, `backend/middleware/rbac.js`, `backend/routes/admin.js` 등
-   **상세 코드**:
    ```javascript
    // 예시: 관리자 전용 API
    // authMiddleware로 인증 -> isAdmin으로 역할 검증
    router.get('/users', authMiddleware, isAdmin, async (req, res) => {
      // ... 관리자만 실행 가능한 로직
    });
    ```

## 4. 안전한 파일 업로드

### 문제점
-   **악성 파일 업로드**: 웹쉘, 바이러스 등 악성 코드가 포함된 파일을 업로드하여 서버를 공격할 수 있습니다.
-   **위장 파일 업로드**: 파일 확장자만 이미지로 바꾸고 실제로는 스크립트인 파일을 업로드하여 XSS 공격에 사용될 수 있습니다.

### 해결 방안
`multer` 라이브러리를 사용하여 파일 업로드 시 여러 단계의 검증을 수행합니다.

1.  **확장자 및 MIME 타입 이중 검증**: 허용된 파일 확장자 목록과 MIME 타입 목록을 모두 검증하여, 확장자만 위조하는 공격을 차단합니다.
2.  **파일명 무작위화**: 서버에 저장 시, `uuid`를 사용하여 파일명을 무작위 문자열로 변경합니다. 이를 통해 파일명 기반의 공격을 방지합니다.
3.  **파일 크기 제한**: 업로드 가능한 파일의 최대 크기를 50MB로 제한하여 대용량 파일로 인한 서비스 거부(DoS) 공격을 방지합니다.

-   **적용된 파일**: `backend/routes/speaker.js`
-   **상세 코드**:
    ```javascript
    const fileFilter = (req, file, cb) => {
      // 허용된 확장자 및 MIME type 목록
      const allowedExtensions = ['.pdf', '.ppt', '.pptx', '.doc', '.docx'];
      const allowedMimeTypes = [ /* ... */ ];

      const ext = path.extname(file.originalname).toLowerCase();
      const mimeType = file.mimetype;

      // 확장자와 MIME type을 모두 검증
      if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(mimeType)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type.'));
      }
    };

    const upload = multer({
      storage,
      fileFilter,
      limits: { fileSize: 50 * 1024 * 1024 } // 50MB 제한
    });
    ```

## 5. API 요청 제한 (Rate Limiting)

### 문제점
특정 API에 비정상적으로 많은 요청을 보내 서버에 과부하를 주거나(DDoS), 로그인 API에 무한정 요청을 보내 비밀번호를 추측하는(Brute Force) 공격이 가능합니다.

### 해결 방안
`express-rate-limit` 라이브러리를 사용하여 IP 주소 기반으로 API 요청 횟수를 제한합니다. 특히 로그인/회원가입과 같이 민감한 API에는 더 엄격한 규칙을 적용합니다.

-   **일반 API**: 15분에 100회 요청
-   **인증 API (로그인/회원가입)**: 15분에 5회 시도
-   **질문 등록 API**: 1시간에 20회 등록

-   **적용된 파일**: `backend/middleware/rateLimiter.js`, `backend/server.js`
-   **상세 코드**:
    ```javascript
    // backend/server.js
    // 모든 API에 기본 Rate Limiting 적용
    app.use('/api/', apiLimiter);

    // backend/routes/auth.js
    // 로그인 API에 더 엄격한 제한 적용
    router.post('/login', authLimiter, loginValidator, async (req, res) => {
      // ...
    });
    ```

## 6. 무차별 대입 공격 (Brute Force) 방지

### 문제점
로그인 시도 횟수에 제한이 없어 공격자가 자동화된 도구를 사용해 비밀번호를 계속 추측하며 계정 탈취를 시도할 수 있습니다.

### 해결 방안
Rate Limiting 외에 추가적으로, 특정 계정에 대한 로그인 실패 횟수를 추적하여 일정 횟수 이상 실패 시 계정을 일시적으로 잠그는 메커니즘을 구현했습니다.

1.  **계정 잠금**: 동일 계정으로 5회 이상 로그인 실패 시 15분간 해당 계정의 로그인을 차단합니다.
2.  **흔한 비밀번호 사용 금지**: `password`, `123456` 등 너무 간단하고 흔한 비밀번호는 회원가입 시 사용할 수 없도록 차단합니다.

-   **적용된 파일**: `backend/utils/loginAttempts.js`, `backend/routes/auth.js`
-   **상세 코드**:
    ```javascript
    // backend/routes/auth.js
    // 계정 잠금 확인
    if (isAccountLocked(email)) {
      return res.status(429).json({ /* ... */ });
    }

    // 비밀번호 검증 실패 시
    if (!isPasswordValid) {
      recordFailedAttempt(email); // 실패 횟수 기록
      return res.status(401).json({ /* ... */ });
    }

    // 로그인 성공 시
    resetAttempts(email); // 시도 기록 초기화
    ```

## 7. CSRF (Cross-Site Request Forgery) 방지

### 문제점
사용자가 우리 서비스에 로그인한 상태에서, 공격자가 만든 악성 사이트에 방문했을 때, 사용자의 의도와 상관없이 사용자의 브라우저가 우리 서비스에 특정 요청(예: 비밀번호 변경)을 보내도록 하는 공격입니다.

### 해결 방안
JWT 토큰을 저장하는 쿠키에 `sameSite: 'strict'` 속성을 부여했습니다. 이 속성은 외부 사이트에서 우리 사이트로 요청을 보낼 때, 해당 쿠키가 함께 전송되는 것을 막아줍니다. 따라서 공격자의 사이트에서 보낸 요청에는 인증 정보(쿠키)가 포함되지 않으므로 서버에서 거부됩니다.

-   **적용된 파일**: `backend/routes/auth.js`
-   **상세 코드**:
    ```javascript
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', // <--- CSRF 방지
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    ```

## 8. 경로 조작 (Path Traversal) 방지

### 문제점
파일 다운로드 요청 시 `../../` 와 같은 경로 조작 문자를 사용하여, `uploads` 폴더 외부의 시스템 파일(예: `/etc/passwd`)에 접근하고 다운로드할 수 있는 취약점입니다.

### 해결 방안
파일 다운로드 요청 처리 시, `path.basename()`을 사용하여 파일명 부분만 추출하고, 최종 파일 경로가 의도된 `uploads` 디렉토리 내에 있는지 검증하여 상위 디렉토리 접근을 차단합니다. `res.sendFile`과 같은 Express 내장 기능은 기본적으로 루트 디렉토리 밖의 파일에 접근하는 것을 방지하여 추가적인 방어선 역할을 합니다.

-   **적용된 파일**: `backend/routes/sessions.js`
-   **상세 코드**:
    ```javascript
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    // path.basename()을 사용하여 경로 조작 방지
    const filePath = path.join(uploadsDir, path.basename(material.storedFileName));

    // 최종 경로가 uploadsDir로 시작하는지 재차 확인
    if (!filePath.startsWith(uploadsDir)) {
      return res.status(403).json({
        error: { message: 'Access denied' }
      });
    }
    ```

## 9. 행사장 입장 관리 보안

### 문제점
참가자의 QR 코드가 공유되거나 복제되어 무단 입장이 발생할 수 있으며, 동일 참가자가 여러 번 입장 체크를 받을 수 있습니다.

### 해결 방안
행사장 입장 시스템에 여러 단계의 검증 및 중복 방지 메커니즘을 구현했습니다.

1.  **고유 사용자 ID 검증**: 참가자의 QR 코드에는 데이터베이스의 고유 사용자 ID가 포함되어 있으며, 스캔 시 해당 ID의 유효성을 검증합니다.
2.  **중복 입장 방지**: 데이터베이스에 `EventEntry` 테이블의 `userId`에 대한 `unique` 제약조건을 설정하여 동일 사용자의 중복 입장을 원천적으로 차단합니다.
3.  **입장 이력 추적**: 모든 입장 시도를 타임스탬프와 함께 기록하여 감사 추적(audit trail)이 가능합니다.
4.  **실시간 피드백**: 이미 입장한 참가자가 재스캔될 경우, 관리자에게 "Already checked in" 메시지를 표시하여 즉시 인지할 수 있도록 합니다.

-   **적용된 파일**: `backend/routes/admin.js`, `backend/prisma/schema.prisma`
-   **상세 코드**:
    ```javascript
    // backend/routes/admin.js
    // 이미 입장했는지 확인
    const existingEntry = await prisma.eventEntry.findUnique({
      where: { userId: parseInt(userId) }
    });

    if (existingEntry) {
      return res.status(200).json({
        message: 'Already checked in',
        alreadyCheckedIn: true,
        entryTime: existingEntry.enteredAt,
        // ...
      });
    }

    // 새로운 입장 기록 생성
    const eventEntry = await prisma.eventEntry.create({
      data: { userId: parseInt(userId) }
    });
    ```

## 10. 실시간 데이터 업데이트 보안

### 문제점
연사 화면에서 실시간으로 질문을 확인하기 위해 폴링(polling)을 사용할 때, 과도한 API 요청으로 서버에 부하를 줄 수 있습니다.

### 해결 방안
실시간 업데이트 기능에 적절한 간격 설정 및 클라이언트 측 제어를 구현했습니다.

1.  **적절한 폴링 간격**: 10초 간격으로 설정하여 서버 부하와 사용자 경험 사이의 균형을 유지합니다.
2.  **선택적 활성화**: 사용자가 실시간 업데이트를 ON/OFF 할 수 있는 토글 제공으로 불필요한 API 호출을 방지합니다.
3.  **Rate Limiting 적용**: 기존의 API Rate Limiting이 모든 질문 조회 API에도 적용되어 과도한 요청을 차단합니다.
4.  **컴포넌트 언마운트 시 정리**: React의 `useEffect` cleanup 함수를 사용하여 컴포넌트가 언마운트될 때 interval을 정리하여 메모리 누수를 방지합니다.

-   **적용된 파일**: `frontend/src/pages/speaker/SessionDetail.jsx`
-   **상세 코드**:
    ```javascript
    useEffect(() => {
      if (!autoRefresh) return;

      const interval = setInterval(() => {
        fetchQuestions();
      }, 10000); // 10초마다 폴링

      return () => clearInterval(interval); // cleanup
    }, [id, autoRefresh, questions.length]);
    ```

## 11. QR 스캔 보안

### 문제점
관리자가 참가자의 QR 코드를 스캔할 때, 유효하지 않은 QR 코드나 조작된 데이터가 입력될 수 있습니다.

### 해결 방안
QR 스캔 프로세스에 여러 단계의 검증을 추가했습니다.

1.  **데이터 타입 검증**: 스캔된 QR 코드 값이 숫자형 사용자 ID인지 확인하고, 유효하지 않은 형식은 즉시 거부합니다.
2.  **사용자 존재 확인**: 데이터베이스에서 해당 ID의 사용자가 실제로 존재하는지 확인합니다.
3.  **중복 스캔 방지**: 클라이언트 측에서 `isProcessing` 상태를 사용하여 처리 중일 때 추가 스캔을 무시합니다.
4.  **타임아웃 처리**: 3초 후 스캔 결과를 자동으로 제거하여 다음 스캔을 준비합니다.

-   **적용된 파일**: `frontend/src/pages/admin/EventEntry.jsx`
-   **상세 코드**:
    ```javascript
    const onScanSuccess = async (decodedText) => {
      if (isProcessing) return; // 중복 방지
      setIsProcessing(true);

      const userId = parseInt(decodedText);
      if (isNaN(userId)) {
        // 유효하지 않은 형식 거부
        setLastScanResult({
          success: false,
          message: `유효하지 않은 QR 코드입니다.`
        });
        return;
      }

      // API 호출 및 검증
      const response = await api.post('/api/admin/event-entry', { userId });
      // ...
    };
    ```

## 12. 기타 보안 강화 조치

-   **비밀번호 해싱**: `bcrypt` 라이브러리를 사용하여 비밀번호를 안전한 해시값으로 변환하여 저장합니다. (Salt 포함, 10라운드)
-   **CORS 정책**: `cors` 라이브러리를 사용하여, 환경 변수에 등록된 허용된 도메인(Whitelist)에서 오는 요청만 허용합니다.
-   **민감 정보 노출 방지**: 프로덕션 환경에서는 상세한 에러 메시지나 스택 트레이스를 사용자에게 노출하지 않습니다.
-   **세션 어뷰징 방지**: 출석 체크용 QR 코드는 60초의 짧은 유효기간을 갖는 일회성 토큰으로 생성하여, QR코드 캡처 이미지 공유를 통한 대리 출석을 방지합니다.
-   **보안 헤더**: `helmet` 라이브러리를 사용하여 기본적인 보안 헤더(HSTS 등)를 적용합니다.
-   **즐겨찾기 필터 권한**: 각 사용자는 자신의 즐겨찾기 정보만 조회할 수 있으며, 다른 사용자의 즐겨찾기는 볼 수 없습니다.
