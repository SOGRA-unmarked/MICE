# ✅ MICE 프로젝트 초기 설정 체크리스트

신규 팀원이 프로젝트를 처음 설정할 때 사용하는 체크리스트입니다.

---

## 📦 사전 준비물

- [ ] Git 설치
- [ ] Node.js 18+ 설치
- [ ] PostgreSQL 14+ 설치
- [ ] 팀원으로부터 받은 `.env` 파일 (또는 설정 정보)

---

## 🔧 설정 단계

### 1. 프로젝트 클론
```bash
git clone https://github.com/your-org/MICE.git
cd MICE
```
- [ ] Git 저장소 클론 완료

---

### 2. PostgreSQL 설정

```bash
# PostgreSQL 설치 (Mac)
brew install postgresql@14

# PostgreSQL 실행
brew services start postgresql@14

# 데이터베이스 생성
createdb mice_db
```

- [ ] PostgreSQL 설치 완료
- [ ] PostgreSQL 서비스 실행 완료
- [ ] `mice_db` 데이터베이스 생성 완료

---

### 3. Backend 설정

```bash
cd backend
```

#### 3-1. 의존성 설치
```bash
npm install
```
- [ ] Backend `npm install` 완료

#### 3-2. 환경 변수 설정
```bash
# .env.example을 복사하여 .env 생성
cp .env.example .env

# .env 파일 편집
# DATABASE_URL, JWT_SECRET 등 설정
```
- [ ] `backend/.env` 파일 생성 완료
- [ ] `DATABASE_URL` 본인 DB 정보로 수정
- [ ] `JWT_SECRET` 팀 공통 키로 설정

**`.env` 파일 예시**:
```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/mice_db?schema=public"
JWT_SECRET="mice-secret-key-2024"
PORT=5050
NODE_ENV=development
```

#### 3-3. Prisma 설정
```bash
# Prisma 클라이언트 생성
npx prisma generate

# 데이터베이스 마이그레이션 (테이블 생성)
npx prisma migrate dev --name init
```
- [ ] `npx prisma generate` 실행 완료
- [ ] `npx prisma migrate dev` 실행 완료
- [ ] 에러 없이 완료 확인

#### 3-4. Backend 서버 실행
```bash
npm run dev
```
- [ ] Backend 서버 실행 완료
- [ ] `http://localhost:5050` 접속 가능 확인
- [ ] "MICE Backend is running" 메시지 확인

---

### 4. Frontend 설정

```bash
cd ../frontend
```

#### 4-1. 의존성 설치
```bash
npm install
```
- [ ] Frontend `npm install` 완료

#### 4-2. Frontend 서버 실행
```bash
npm run dev
```
- [ ] Frontend 서버 실행 완료
- [ ] `http://localhost:3000` 접속 가능 확인
- [ ] 로그인 페이지 표시 확인

---

### 5. 테스트 계정 생성

Backend 서버가 실행 중인 상태에서:

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

- [ ] Admin 계정 생성 완료
- [ ] Speaker 계정 생성 완료
- [ ] Attendee 계정 생성 완료

---

### 6. 로그인 테스트

`http://localhost:3000`에서:

**Admin 로그인**:
- Email: `admin@mice.com`
- Password: `admin123`

- [ ] Admin 계정으로 로그인 성공
- [ ] 관리자 대시보드 접속 확인

**Speaker 로그인**:
- Email: `speaker@mice.com`
- Password: `speaker123`

- [ ] Speaker 계정으로 로그인 성공

**Attendee 로그인**:
- Email: `attendee@mice.com`
- Password: `attendee123`

- [ ] Attendee 계정으로 로그인 성공

---

## 🎉 설정 완료!

모든 체크리스트를 완료했다면 개발을 시작할 수 있습니다!

---

## ⚠️ 문제 해결

### PostgreSQL 연결 실패
```bash
# PostgreSQL 실행 확인
brew services list | grep postgresql

# 재시작
brew services restart postgresql@14

# .env의 DATABASE_URL 확인
```

### "Port 5050 already in use" 에러
```bash
# 5050 포트 사용 중인 프로세스 확인
lsof -i :5050

# 프로세스 종료
kill -9 <PID>
```

### Prisma 마이그레이션 에러
```bash
# 데이터베이스 재생성
dropdb mice_db
createdb mice_db

# 마이그레이션 재시도
npx prisma migrate dev --name init
```

### "Cannot find module" 에러
```bash
# node_modules 재설치
rm -rf node_modules package-lock.json
npm install
```

---

## 📞 도움 요청

문제가 해결되지 않으면:
1. 팀 채팅방에 질문
2. [COLLABORATION_GUIDE.md](./COLLABORATION_GUIDE.md) 참고
3. GitHub Issues에 등록

---

**다음 단계**: [COLLABORATION_GUIDE.md](./COLLABORATION_GUIDE.md)를 읽고 협업 규칙을 숙지하세요!
