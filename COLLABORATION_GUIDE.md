# 🤝 MICE 프로젝트 협업 가이드

이 문서는 GitHub를 통해 MICE 프로젝트를 협업하는 팀원들을 위한 초기 설정 가이드입니다.

---

## 📂 Git에 포함되지 않는 파일들

아래 파일들은 `.gitignore`에 의해 GitHub에 업로드되지 않으므로, **별도로 공유**하거나 **각자 생성**해야 합니다.

### 🔐 반드시 별도 공유가 필요한 파일

| 파일 경로 | 용도 | 공유 방법 |
|---------|------|----------|
| `backend/.env` | 데이터베이스 연결 정보, JWT 시크릿 키 | 보안 메신저, 암호화된 파일 공유 |

> ⚠️ **보안 주의**: `.env` 파일은 민감한 정보를 포함하므로 **절대 GitHub에 올리지 말고**, Slack DM, 카카오톡, 또는 암호화된 공유 서비스를 통해 전달하세요.

### 📦 자동 생성되는 파일/폴더 (공유 불필요)

| 경로 | 설명 | 생성 방법 |
|-----|------|----------|
| `backend/node_modules/` | Backend 의존성 패키지 | `npm install` |
| `frontend/node_modules/` | Frontend 의존성 패키지 | `npm install` |
| `backend/uploads/` | 업로드된 파일 저장소 | 서버 실행 시 자동 생성 |
| `backend/prisma/migrations/` | 데이터베이스 마이그레이션 히스토리 | `npx prisma migrate dev` |
| `frontend/dist/` | 프론트엔드 빌드 결과물 | `npm run build` |

---

## 🚀 신규 팀원 초기 설정 가이드

### 1️⃣ 프로젝트 클론

```bash
git clone https://github.com/your-org/MICE.git
cd MICE
```

---

### 2️⃣ Backend 설정

#### A. 의존성 설치
```bash
cd backend
npm install
```

#### B. 환경 변수 파일 생성

팀원으로부터 받은 `.env` 파일을 `backend/` 디렉토리에 복사하거나, 아래 내용으로 새로 생성:

**파일 위치**: `backend/.env`

```env
# 데이터베이스 연결 정보
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/mice_db?schema=public"

# JWT 시크릿 키 (팀에서 공유한 키 사용)
JWT_SECRET="mice-secret-key-2024"

# 서버 포트
PORT=5050

# 개발 환경
NODE_ENV=development
```

> 📝 **참고**:
> - `your_password`는 본인의 PostgreSQL 비밀번호로 변경
> - `JWT_SECRET`은 팀 전체가 동일한 값을 사용해야 토큰 호환 가능

#### C. PostgreSQL 설정

```bash
# PostgreSQL 설치 (Mac)
brew install postgresql@14
brew services start postgresql@14

# 데이터베이스 생성
createdb mice_db
```

#### D. Prisma 마이그레이션

```bash
# Prisma 클라이언트 생성
npx prisma generate

# 데이터베이스 테이블 생성
npx prisma migrate dev --name init
```

#### E. Backend 서버 실행

```bash
npm run dev
```

✅ 성공 시 `http://localhost:5050`에서 서버 실행됨

---

### 3️⃣ Frontend 설정

#### A. 의존성 설치
```bash
cd ../frontend
npm install
```

#### B. Frontend 서버 실행

```bash
npm run dev
```

✅ 성공 시 `http://localhost:3000`에서 프론트엔드 실행됨

---

### 4️⃣ 초기 테스트 사용자 생성

Backend 서버가 실행 중인 상태에서 아래 명령어로 테스트 계정 생성:

```bash
# Admin 계정
curl -X POST http://localhost:5050/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mice.com",
    "password": "admin123",
    "name": "관리자",
    "role": "ADMIN"
  }'

# Speaker 계정
curl -X POST http://localhost:5050/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "speaker@mice.com",
    "password": "speaker123",
    "name": "연사",
    "role": "SPEAKER"
  }'

# Attendee 계정
curl -X POST http://localhost:5050/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "attendee@mice.com",
    "password": "attendee123",
    "name": "참가자",
    "role": "ATTENDEE"
  }'
```

---

## 🔑 `.env` 파일 상세 설명

### `backend/.env`

| 변수명 | 설명 | 예시 | 비고 |
|-------|------|------|------|
| `DATABASE_URL` | PostgreSQL 연결 문자열 | `postgresql://postgres:asd@localhost:5432/mice_db?schema=public` | **팀원마다 다를 수 있음** (로컬 DB 설정에 따라) |
| `JWT_SECRET` | JWT 토큰 암호화 키 | `mice-secret-key-2024` | **팀 전체 동일한 값 사용** |
| `PORT` | Backend 서버 포트 | `5050` | 변경 불필요 |
| `NODE_ENV` | 실행 환경 | `development` | 변경 불필요 |

---

## 📋 협업 시 주의사항

### ✅ DO (해야 할 것)

1. **작업 전 항상 pull 받기**
   ```bash
   git pull origin main
   ```

2. **새로운 패키지 설치 시 팀원에게 알리기**
   ```bash
   # Backend 패키지 추가 시
   cd backend && npm install new-package

   # Frontend 패키지 추가 시
   cd frontend && npm install new-package

   # package.json 변경사항을 Git에 커밋
   git add package.json package-lock.json
   git commit -m "Add new-package dependency"
   ```

3. **데이터베이스 스키마 변경 시**
   ```bash
   # schema.prisma 수정 후
   npx prisma migrate dev --name describe_your_changes

   # 팀원에게 알림: "prisma migrate 필요"
   ```

4. **환경 변수 추가 시**
   - `.env.example` 파일에 예시 추가
   - 팀원들에게 새로운 환경 변수 알림

### ❌ DON'T (하지 말아야 할 것)

1. **`.env` 파일을 Git에 커밋하지 마세요**
   ```bash
   # 만약 실수로 추가했다면
   git rm --cached backend/.env
   ```

2. **`node_modules/`를 Git에 커밋하지 마세요**
   - 이미 `.gitignore`에 포함되어 있음

3. **개인 설정 파일을 Git에 커밋하지 마세요**
   - `.vscode/`, `.idea/` 등

---

## 🆘 문제 해결

### 문제 1: "Cannot find module" 에러

**원인**: 누군가 새로운 패키지를 설치했는데 내가 `npm install`을 안 함

**해결**:
```bash
cd backend && npm install
cd ../frontend && npm install
```

---

### 문제 2: Prisma 관련 에러

**원인**: DB 스키마가 변경되었는데 마이그레이션을 안 함

**해결**:
```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

---

### 문제 3: 포트 충돌 (Port already in use)

**원인**: 이미 실행 중인 서버가 있음

**해결**:
```bash
# Backend 5050 포트 확인
lsof -i :5050
kill -9 <PID>

# Frontend 3000 포트 확인
lsof -i :3000
kill -9 <PID>
```

---

### 문제 4: DATABASE_URL 연결 실패

**원인**: PostgreSQL이 실행되지 않았거나 비밀번호가 틀림

**해결**:
```bash
# PostgreSQL 실행 확인
brew services list | grep postgresql

# 실행
brew services start postgresql@14

# .env 파일의 DATABASE_URL 확인 (비밀번호, 포트 등)
```

---

## 📞 팀원 간 공유가 필요한 정보

### 프로젝트 리더가 공유해야 할 것

- [ ] `backend/.env` 파일 (보안 채널을 통해)
- [ ] PostgreSQL 계정 정보 (필요시)
- [ ] 공통 `JWT_SECRET` 값
- [ ] Git 저장소 URL
- [ ] 프로젝트 협업 규칙 (브랜치 전략, 커밋 컨벤션 등)

### 신규 팀원이 설정해야 할 것

- [ ] Git 클론
- [ ] PostgreSQL 설치 및 데이터베이스 생성
- [ ] Backend `.env` 파일 생성
- [ ] `npm install` (Backend, Frontend 각각)
- [ ] Prisma 마이그레이션
- [ ] 서버 실행 확인
- [ ] 테스트 계정으로 로그인 테스트

---

## 📚 추가 문서

- [프로젝트 README](./README.md)
- [Backend 문서](./backend/README.md)
- [Frontend 문서](./frontend/README.md)

---

## 💬 문의

설정 과정에서 문제가 발생하면 팀 채팅방에 질문하거나, 이 저장소의 Issues에 등록해주세요!
