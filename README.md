# MICE 행사 관리 시스템

충청권 MICE 행사/컨퍼런스 비표 발급 및 세션 관리 웹 서비스

## 프로젝트 개요

MICE 행사를 위한 올인원 관리 플랫폼입니다.

### 핵심 기능

1. **역할 기반 접근 제어 (RBAC)**
   - Admin, Speaker, Attendee 3가지 역할
   - 각 역할에 맞는 기능 제공

2. **하이브리드 QR 인증 시스템**
   - **정적 QR**: 참가자의 '나의 비표'로 메인 입장
   - **동적 QR**: 60초마다 갱신되는 QR로 세션 출석 체크 (어뷰징 방지)

3. **세션 관리**
   - Q&A 시스템
   - 발표 자료 업로드/다운로드
   - 즐겨찾기 기능

4. **보안**
   - JWT 인증
   - Bcrypt 비밀번호 해싱
   - 파일 업로드 보안 (확장자 whitelist, 크기 제한)

## 기술 스택

### Backend
- Node.js + Express.js
- PostgreSQL + Prisma ORM
- JWT + Bcrypt
- Multer (파일 업로드)
- Node-Cache (동적 QR 토큰 관리)

### Frontend
- React 18 + Vite
- React Router
- Tailwind CSS
- Axios
- qrcode.react (QR 생성)
- html5-qrcode (QR 스캔)

## 프로젝트 구조

```
MICE/
├── backend/              # Node.js 백엔드
│   ├── prisma/          # Prisma 스키마
│   ├── routes/          # API 라우트
│   ├── middleware/      # 인증/RBAC 미들웨어
│   ├── uploads/         # 업로드된 파일
│   └── server.js        # 서버 엔트리포인트
│
├── frontend/            # React 프론트엔드
│   ├── src/
│   │   ├── components/  # 공통 컴포넌트
│   │   ├── context/     # Context API
│   │   ├── pages/       # 페이지 컴포넌트
│   │   └── App.jsx
│   └── index.html
│
└── README.md
```

## 설치 및 실행

### 사전 요구사항
- Node.js 18+
- PostgreSQL
- npm 또는 yarn

### 1. Backend 설정

```bash
cd backend
npm install

# .env 파일 설정 (DATABASE_URL, JWT_SECRET 등)
cp .env.example .env

# Prisma 설정
npx prisma generate
npx prisma migrate dev --name init

# 서버 실행
npm run dev
```

Backend는 `http://localhost:5050`에서 실행됩니다.

### 2. Frontend 설정

```bash
cd frontend
npm install

# 개발 서버 실행
npm run dev
```

Frontend는 `http://localhost:3000`에서 실행됩니다.

## 데이터베이스 스키마

주요 테이블:
- **Users**: 사용자 (Admin, Speaker, Attendee)
- **Sessions**: 세션 정보
- **Session_Materials**: 발표 자료
- **Questions**: Q&A
- **Favorites**: 즐겨찾기
- **Attendance_Logs**: 출석 로그

자세한 스키마는 `backend/prisma/schema.prisma` 참조

## API 엔드포인트

### 인증 (Public)
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인

### 참가자 (Attendee)
- `GET /api/sessions` - 세션 목록
- `GET /api/sessions/:id` - 세션 상세
- `POST /api/sessions/:id/questions` - 질문 등록
- `POST /api/sessions/check-in` - 출석 체크

### 연사 (Speaker)
- `GET /api/speaker/my-sessions` - 내 세션 목록
- `GET /api/speaker/sessions/:id/questions` - Q&A 조회
- `POST /api/speaker/sessions/:id/material` - 자료 업로드

### 관리자 (Admin)
- `GET/POST/PUT/DELETE /api/admin/users` - 사용자 관리
- `GET/POST/PUT/DELETE /api/admin/sessions` - 세션 관리
- `GET /api/admin/sessions/:id/dynamic-qr` - 동적 QR 생성

전체 API 문서는 `backend/README.md` 참조

## 보안 기능

### 1. RBAC (역할 기반 접근 제어)
- 미들웨어를 통한 역할 검증
- Frontend 라우트 가드

### 2. JWT 인증
- 7일 유효기간
- 모든 보호된 API에 필요

### 3. 동적 QR 시스템
- 60초 TTL로 어뷰징 방지
- Node-Cache로 토큰 관리

### 4. 파일 업로드 보안
- 확장자 whitelist (pdf, ppt, pptx, doc, docx)
- UUID 파일명 변경
- 50MB 크기 제한

## 초기 데이터 생성

### 테스트 사용자 생성

```bash
# Backend 서버가 실행 중일 때
curl -X POST http://localhost:5050/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mice.com",
    "password": "admin123",
    "name": "Admin User",
    "role": "ADMIN"
  }'
```

또는 Prisma Studio 사용:
```bash
cd backend
npx prisma studio
```

## 주요 화면

### Attendee
1. **세션 목록**: 전체 세션 조회 및 카드 형태로 표시
2. **세션 상세**: 세션 정보, Q&A, 자료 다운로드
3. **나의 비표**: 정적 QR 코드 (입장용)
4. **출석 스캔**: 카메라로 동적 QR 스캔

### Speaker
1. **내 세션**: 할당된 세션 목록
2. **세션 관리**: Q&A 조회, 발표 자료 업로드

### Admin
1. **대시보드**: 통계 및 빠른 액션
2. **사용자 관리**: CRUD 기능
3. **세션 관리**: CRUD 기능
4. **동적 QR 표시**: 60초마다 갱신되는 QR (전체 화면 모드)

## 개발 워크플로우

### 1. Backend 개발
```bash
cd backend
npm run dev  # nodemon으로 자동 재시작
```

### 2. Frontend 개발
```bash
cd frontend
npm run dev  # Vite HMR로 즉시 반영
```

### 3. 데이터베이스 변경
```bash
cd backend
# schema.prisma 수정 후
npx prisma migrate dev --name describe_changes
npx prisma generate
```

## 배포

### Backend
1. 환경 변수 설정 (DATABASE_URL, JWT_SECRET)
2. `npm start`로 프로덕션 모드 실행
3. Nginx 또는 Apache로 리버스 프록시 설정

### Frontend
1. `npm run build`로 빌드
2. `dist/` 폴더를 정적 호스팅 서비스에 배포
3. API URL 환경 변수 설정

## 문제 해결

### CORS 에러
Backend의 `cors` 설정 확인:
```javascript
app.use(cors({ origin: 'http://localhost:3000' }))
```
포트는 5050번을 사용합니다.

### 데이터베이스 연결 실패
`.env` 파일의 `DATABASE_URL` 확인

### QR 스캔이 작동하지 않음
- HTTPS 환경에서만 카메라 접근 가능
- 카메라 권한 허용 확인

## 라이선스

MIT

## 기여

이슈 및 PR 환영합니다!

## 문서

- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)
- [API 문서](./backend/README.md#api-엔드포인트)
