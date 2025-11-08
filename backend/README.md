# MICE Backend API

충청권 MICE 행사 관리 시스템 백엔드 서버

## 기술 스택

- **Node.js** + **Express.js**
- **Prisma ORM** (PostgreSQL)
- **JWT** (인증)
- **Bcrypt** (비밀번호 해싱)
- **Multer** (파일 업로드)
- **Node-Cache** (동적 QR 토큰 관리)

## 설치 및 실행

### 1. 의존성 설치
```bash
cd backend
npm install
```

### 2. 환경 변수 설정
`.env` 파일을 생성하고 아래 내용을 설정하세요:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mice_db?schema=public"
JWT_SECRET="your-secret-key"
PORT=5050
NODE_ENV=development
```

### 3. 데이터베이스 설정
```bash
# Prisma 클라이언트 생성
npx prisma generate

# 데이터베이스 마이그레이션
npx prisma migrate dev --name init

# (선택) Prisma Studio로 DB 확인
npx prisma studio
```

### 4. 서버 실행
```bash
# 개발 모드 (nodemon)
npm run dev

# 프로덕션 모드
npm start
```

서버는 `http://localhost:5050`에서 실행됩니다.

## API 엔드포인트

### 인증 (Public)
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인

### 사용자
- `GET /api/users/me` - 내 정보 조회 (인증 필요)

### 세션 (Attendee)
- `GET /api/sessions` - 세션 목록
- `GET /api/sessions/:id` - 세션 상세
- `POST /api/sessions/:id/questions` - 질문 등록
- `POST /api/sessions/:id/favorite` - 즐겨찾기 추가
- `DELETE /api/sessions/:id/favorite` - 즐겨찾기 제거
- `GET /api/sessions/:id/material` - 자료 다운로드
- `POST /api/sessions/check-in` - 출석 체크 (동적 QR 스캔)

### 연사 (Speaker)
- `GET /api/speaker/my-sessions` - 내 세션 목록
- `GET /api/speaker/sessions/:id/questions` - 내 세션 Q&A
- `POST /api/speaker/sessions/:id/material` - 발표 자료 업로드

### 관리자 (Admin)
- `GET /api/admin/users` - 사용자 목록
- `POST /api/admin/users` - 사용자 생성
- `PUT /api/admin/users/:id` - 사용자 수정
- `DELETE /api/admin/users/:id` - 사용자 삭제
- `GET /api/admin/sessions` - 세션 목록
- `POST /api/admin/sessions` - 세션 생성
- `PUT /api/admin/sessions/:id` - 세션 수정
- `DELETE /api/admin/sessions/:id` - 세션 삭제
- `GET /api/admin/sessions/:id/dynamic-qr` - 동적 QR 생성 (60초 TTL)
- `GET /api/admin/sessions/:id/attendance` - 출석 현황

## 보안 기능

### 1. RBAC (역할 기반 접근 제어)
- **ADMIN**: 전체 시스템 관리
- **SPEAKER**: 본인 세션 관리
- **ATTENDEE**: 세션 참가 및 질문

### 2. JWT 인증
- 모든 보호된 API는 `Authorization: Bearer <token>` 헤더 필요
- 토큰 유효기간: 7일

### 3. 동적 QR 시스템
- 60초마다 새로운 토큰 생성
- 어뷰징 방지 (QR 사진 공유 차단)

### 4. 파일 업로드 보안
- 확장자 whitelist (pdf, ppt, pptx, doc, docx)
- UUID 파일명 변경
- 50MB 크기 제한

## 데이터베이스 스키마

주요 테이블:
- `users` - 사용자
- `sessions` - 세션
- `session_materials` - 발표 자료
- `questions` - Q&A
- `favorites` - 즐겨찾기
- `attendance_logs` - 출석 로그

## 개발 팁

### 초기 데이터 생성
```javascript
// Prisma Studio 사용
npx prisma studio
```

### 테스트 사용자 생성
```bash
POST /api/auth/register
{
  "email": "admin@mice.com",
  "password": "admin123",
  "name": "Admin User",
  "role": "ADMIN"
}
```
