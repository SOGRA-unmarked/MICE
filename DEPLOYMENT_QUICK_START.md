# 🚀 MICE 배포 빠른 시작 가이드

**목표 URL**: `https://mice.vercel.app`

5단계로 빠르게 배포하는 가이드입니다. 상세 내용은 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)를 참고하세요.

---

## ⚡ 5단계 배포

### STEP 1: GitHub에 코드 푸시 (5분)

```bash
# 로컬 프로젝트에서
git add .
git commit -m "Ready for deployment"
git push origin main
```

✅ GitHub 저장소에 코드 업로드 완료

---

### STEP 2: Railway로 Backend 배포 (10분)

1. **https://railway.app** 접속 → GitHub로 로그인
2. **New Project** → **Deploy from GitHub repo** → **MICE** 선택
3. **Settings** → **Root Directory**: `backend` 입력
4. **New** → **Database** → **Add PostgreSQL**
5. **Variables** 탭에서 환경 변수 추가:
   - `JWT_SECRET`: `mice-secret-key-2024`
   - `PORT`: `5050`
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: `https://mice.vercel.app` (일단 입력, 나중에 확인)
6. **Settings** → **Generate Domain** 클릭
7. **생성된 URL 복사** (예: `https://mice-api.up.railway.app`)

✅ Backend 배포 완료

---

### STEP 3: Vercel로 Frontend 배포 (5분)

1. **https://vercel.com** 접속 → GitHub로 로그인
2. **Add New Project** → **MICE** 저장소 선택
3. **Configure Project**:
   - **Root Directory**: `frontend` 선택
   - **Environment Variables** 추가:
     - Name: `VITE_API_URL`
     - Value: Railway에서 복사한 Backend URL (예: `https://mice-api.up.railway.app`)
4. **Deploy** 클릭
5. 2-3분 대기
6. **생성된 URL 확인** (예: `https://mice.vercel.app`)

✅ Frontend 배포 완료

---

### STEP 4: Backend CORS 업데이트 (2분)

1. Railway 대시보드 → Backend 서비스
2. **Variables** 탭
3. `FRONTEND_URL` 값을 Vercel URL로 업데이트
   - 예: `https://mice.vercel.app`
4. 자동 재배포 대기 (1-2분)

✅ CORS 설정 완료

---

### STEP 5: 초기 사용자 생성 (3분)

**먼저 Backend API URL을 확인하세요:**

1. Railway Dashboard → **Backend 서비스 클릭** (PostgreSQL 서비스 ❌, Backend 서비스 ✅)
2. **Settings** 탭 → **Public Networking** 섹션
3. **Generate Domain** 버튼 클릭 (아직 안 했다면)
4. 생성된 URL 복사 (예: `https://web-production-xxxx.up.railway.app`)

⚠️ **주의**: `postgres-production-xxxx.up.railway.app`는 **데이터베이스 URL**입니다. curl 명령어에는 사용하지 마세요!

---

**본인의 Mac 터미널**을 열고 아래 명령어 실행:

> 💡 **https://mice-production.up.railway.app**을 위에서 복사한 Backend URL로 변경하세요!

```bash
# Admin 계정 생성
curl -X POST https://mice-production.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mice.com",
    "password": "admin123",
    "name": "관리자",
    "role": "ADMIN"
  }'
```

**성공하면 이런 응답이 나옵니다:**
```json
{"message":"User created successfully","user":{"id":1,"email":"admin@mice.com",...}}
```

나머지도 실행:

```bash
# Speaker 계정 생성
curl -X POST https://mice-production.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "speaker@mice.com",
    "password": "speaker123",
    "name": "연사",
    "role": "SPEAKER"
  }'

# Attendee 계정 생성
curl -X POST https://mice-production.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "attendee@mice.com",
    "password": "attendee123",
    "name": "참가자",
    "role": "ATTENDEE"
  }'
```

✅ 테스트 계정 생성 완료

> 💡 **curl이 없다면?** Postman을 사용하거나 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) 참고

---

## 🎉 배포 완료!

### 접속 테스트

1. **https://mice.vercel.app** 접속
2. 로그인: `admin@mice.com` / `admin123`
3. 관리자 대시보드 확인

---

## 📝 생성된 파일 목록

배포를 위해 다음 파일들이 생성/수정되었습니다:

### Backend
- ✅ `backend/package.json` - build 스크립트 추가
- ✅ `backend/server.js` - CORS 설정 수정
- ✅ `backend/railway.json` - Railway 설정
- ✅ `backend/.env.example` - 환경 변수 예시 업데이트

### Frontend
- ✅ `frontend/vercel.json` - Vercel 설정 (SPA 라우팅, 보안 헤더)
- ✅ `frontend/vite.config.js` - 빌드 최적화
- ✅ `frontend/src/config/api.js` - API 클라이언트
- ✅ `frontend/.env.example` - 환경 변수 예시
- ✅ `frontend/.env.production` - 프로덕션 환경 변수
- ✅ `frontend/.gitignore` - .env 파일 제외

### 문서
- ✅ `DEPLOYMENT_GUIDE.md` - 상세 배포 가이드
- ✅ `DEPLOYMENT_CHECKLIST.md` - 배포 체크리스트
- ✅ `DEPLOYMENT_QUICK_START.md` - 이 파일
- ✅ `README.md` - 배포 정보 추가

---

## 🔒 보안 확인

- ✅ `.env` 파일이 `.gitignore`에 포함됨
- ✅ HTTPS 자동 적용
- ✅ CORS가 Vercel URL만 허용
- ✅ 환경 변수가 안전하게 저장됨

---

## ⚠️ 문제 해결

### Frontend가 Backend에 연결 안 됨
→ Vercel 환경 변수 `VITE_API_URL` 확인

### CORS 에러
→ Railway `FRONTEND_URL`이 Vercel URL과 일치하는지 확인

### 로그인 안 됨
→ 초기 사용자를 생성했는지 확인 (STEP 5)

---

## 📚 더 알아보기

- [상세 배포 가이드](./DEPLOYMENT_GUIDE.md)
- [배포 체크리스트](./DEPLOYMENT_CHECKLIST.md)
- [협업 가이드](./COLLABORATION_GUIDE.md)

---

**배포 소요 시간**: 약 25-30분
**비용**: Railway $5 무료 크레딧 + Vercel 무료
