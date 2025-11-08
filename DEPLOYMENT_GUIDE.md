# 🚀 MICE 프로젝트 배포 가이드 (Vercel + Railway)

이 문서는 MICE 프로젝트를 Vercel(Frontend) + Railway(Backend + DB)로 배포하는 완전한 가이드입니다.

## 📋 배포 개요

- **Frontend**: Vercel → `https://mice.vercel.app`
- **Backend API**: Railway → `https://mice-api.up.railway.app`
- **Database**: Railway PostgreSQL (자동 생성)
- **예상 소요 시간**: 30-40분

---

## 🎯 사전 준비

### 필수 계정
- [ ] GitHub 계정
- [ ] Railway 계정 (https://railway.app - GitHub로 가입)
- [ ] Vercel 계정 (https://vercel.com - GitHub로 가입)

### 필수 작업
- [ ] GitHub에 프로젝트 업로드 완료
- [ ] `.env` 파일이 `.gitignore`에 포함되어 있는지 확인

---

## 📦 STEP 1: GitHub에 프로젝트 업로드

### 1-1. 로컬에서 Git 초기화 (아직 안 했다면)

```bash
cd /Users/jeongmin-yong/MICE

# Git 초기화
git init

# 모든 파일 추가
git add .

# 첫 커밋
git commit -m "Initial commit: MICE project"
```

### 1-2. GitHub 저장소 생성

1. https://github.com/new 접속
2. Repository name: `MICE` (또는 원하는 이름)
3. **Private** 또는 **Public** 선택
4. **Create repository** 클릭

### 1-3. GitHub에 푸시

```bash
# GitHub 저장소 연결 (your-username을 본인 것으로 변경)
git remote add origin https://github.com/your-username/MICE.git

# 푸시
git branch -M main
git push -u origin main
```

✅ GitHub 저장소에 코드가 업로드되었는지 확인

---

## 🚂 STEP 2: Railway로 Backend + DB 배포

### 2-1. Railway 계정 생성

1. https://railway.app 접속
2. **Login with GitHub** 클릭
3. GitHub 계정으로 로그인
4. Railway 권한 승인

### 2-2. 새 프로젝트 생성

1. Railway 대시보드에서 **New Project** 클릭
2. **Deploy from GitHub repo** 선택
3. GitHub 저장소 목록에서 **MICE** 선택
   - 만약 보이지 않으면 **Configure GitHub App** → 저장소 권한 부여

### 2-3. Backend 서비스 설정

1. 배포된 프로젝트 클릭
2. **Settings** 탭 이동
3. **Root Directory** 설정: `backend` 입력 ✅ 중요!
4. **Start Command** 확인: `npm start` (자동 감지됨)

### 2-4. PostgreSQL 데이터베이스 추가

1. 프로젝트 화면에서 **New** 버튼 클릭
2. **Database** → **Add PostgreSQL** 선택
3. PostgreSQL 서비스 자동 생성됨 ✅

### 2-5. Backend 환경 변수 설정

1. Backend 서비스 클릭
2. **Variables** 탭 이동
3. 아래 환경 변수 추가:

#### 자동으로 설정되는 변수:
- `DATABASE_URL` - PostgreSQL이 자동으로 연결해줌 ✅

#### 수동으로 추가할 변수:
| Variable Name | Value |
|--------------|-------|
| `JWT_SECRET` | `mice-secret-key-2024` |
| `PORT` | `5050` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://mice.vercel.app` (나중에 Vercel URL로 업데이트) |

**추가 방법**:
- **New Variable** 클릭
- Variable Name 입력
- Value 입력
- **Add** 클릭

### 2-6. Prisma 마이그레이션 설정

Railway는 자동으로 `npm run build`를 실행하므로, `package.json`에 build 스크립트가 있어야 합니다.

✅ 이미 코드에 포함되어 있음 (아래에서 수정 예정)

### 2-7. Backend 배포 URL 확인

1. Backend 서비스 클릭
2. **Settings** 탭 → **Public Networking** 섹션
3. **Generate Domain** 클릭
4. 생성된 URL 복사 (예: `https://mice-api.up.railway.app`)

✅ **이 URL을 메모하세요!** Frontend에서 사용합니다.

---

## ⚡ STEP 3: Vercel로 Frontend 배포

### 3-1. Vercel 계정 생성

1. https://vercel.com 접속
2. **Sign Up** → **Continue with GitHub** 클릭
3. GitHub 계정으로 로그인

### 3-2. 새 프로젝트 생성

1. Vercel 대시보드에서 **Add New...** → **Project** 클릭
2. **Import Git Repository** 섹션에서 **MICE** 저장소 선택
   - 없으면 **Adjust GitHub App Permissions** → 저장소 권한 부여
3. **Import** 클릭

### 3-3. 프로젝트 설정

#### Configure Project 화면:

1. **Framework Preset**: Vite 자동 감지 ✅
2. **Root Directory**: `frontend` 선택 ✅ 중요!
3. **Build Settings**:
   - Build Command: `npm run build` (자동)
   - Output Directory: `dist` (자동)
4. **Environment Variables** 추가:

| Name | Value |
|------|-------|
| `VITE_API_URL` | Railway에서 복사한 Backend URL (예: `https://mice-api.up.railway.app`) |

**추가 방법**:
- **Environment Variables** 섹션 펼치기
- Name에 `VITE_API_URL` 입력
- Value에 Railway Backend URL 붙여넣기
- **Add** 클릭

5. **Deploy** 클릭

### 3-4. 배포 완료 대기

- 약 2-3분 소요
- 배포 로그 실시간 확인 가능
- 완료되면 축하 화면 표시 🎉

### 3-5. Frontend URL 확인

1. **Visit** 버튼 클릭 또는
2. 프로젝트 대시보드에서 URL 확인
3. URL: `https://mice.vercel.app` (또는 자동 생성된 URL)

---

## 🔄 STEP 4: Backend CORS 업데이트

Frontend URL이 확정되었으므로 Backend CORS 설정을 업데이트해야 합니다.

### 4-1. Railway Backend 환경 변수 업데이트

1. Railway 대시보드 → Backend 서비스 클릭
2. **Variables** 탭
3. `FRONTEND_URL` 변수를 Vercel URL로 업데이트
   - 예: `https://mice.vercel.app`
4. **자동으로 재배포됨** ✅

---

## ✅ STEP 5: 배포 확인 및 테스트

### 5-1. 데이터베이스 마이그레이션 확인

Railway Backend 서비스에서:
1. **Deployments** 탭 클릭
2. 최신 배포 로그 확인
3. Prisma 마이그레이션 성공 확인

### 5-2. Frontend 접속 테스트

1. `https://mice.vercel.app` 접속
2. 로그인 페이지 표시 확인 ✅

### 5-3. 초기 사용자 생성

Railway Backend에 직접 API 호출:

```bash
# Railway Backend URL 사용 (본인 URL로 변경)
curl -X POST https://mice-api.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mice.com",
    "password": "admin123",
    "name": "관리자",
    "role": "ADMIN"
  }'

curl -X POST https://mice-api.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "speaker@mice.com",
    "password": "speaker123",
    "name": "연사",
    "role": "SPEAKER"
  }'

curl -X POST https://mice-api.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "attendee@mice.com",
    "password": "attendee123",
    "name": "참가자",
    "role": "ATTENDEE"
  }'
```

### 5-4. 로그인 테스트

1. Frontend (`https://mice.vercel.app`)에서 로그인
2. Email: `admin@mice.com`
3. Password: `admin123`
4. 관리자 대시보드 접속 확인 ✅

---

## 🔒 보안 체크리스트

배포 후 반드시 확인:

- [ ] `.env` 파일이 GitHub에 업로드되지 않았는지 확인
- [ ] Railway 환경 변수에 `JWT_SECRET` 설정됨
- [ ] Frontend에서 HTTPS로 접속됨 (`https://`)
- [ ] Backend에서 HTTPS로 접속됨 (`https://`)
- [ ] CORS가 Vercel URL만 허용하는지 확인
- [ ] PostgreSQL이 Private Network로 연결되었는지 확인 (Railway 자동)

---

## 🎨 커스텀 도메인 설정 (선택)

### Vercel에서 커스텀 도메인 추가

1. Vercel 프로젝트 → **Settings** → **Domains**
2. 도메인 입력 (예: `mice-event.com`)
3. DNS 레코드 추가 (Vercel 지시사항 따르기)

### Railway에서 커스텀 도메인 추가

1. Railway Backend 서비스 → **Settings**
2. **Custom Domain** 입력 (예: `api.mice-event.com`)
3. DNS 레코드 추가

---

## 🔧 배포 후 업데이트 방법

### Frontend 업데이트

1. 로컬에서 코드 수정
2. Git에 커밋 & 푸시
   ```bash
   git add .
   git commit -m "Update frontend"
   git push
   ```
3. Vercel이 **자동으로 재배포** ✅

### Backend 업데이트

1. 로컬에서 코드 수정
2. Git에 커밋 & 푸시
   ```bash
   git add .
   git commit -m "Update backend"
   git push
   ```
3. Railway가 **자동으로 재배포** ✅

---

## 📊 모니터링

### Railway
- **Metrics** 탭: CPU, 메모리, 네트워크 사용량
- **Deployments** 탭: 배포 히스토리 및 로그
- **Observability** 탭: 애플리케이션 로그 실시간 확인

### Vercel
- **Analytics** 탭: 방문자 통계
- **Logs** 탭: 실시간 로그 확인
- **Speed Insights**: 성능 분석

---

## ⚠️ 문제 해결

### Frontend가 Backend API를 호출하지 못함

**원인**: CORS 또는 API URL 문제

**해결**:
1. Vercel 환경 변수에 `VITE_API_URL`이 올바른지 확인
2. Railway `FRONTEND_URL`이 Vercel URL과 일치하는지 확인
3. 브라우저 콘솔에서 에러 확인

### Database connection failed

**원인**: Prisma 마이그레이션 실패

**해결**:
1. Railway Backend 서비스 → **Deployments** → 로그 확인
2. `DATABASE_URL` 환경 변수 확인
3. 필요시 수동 마이그레이션:
   - Railway CLI 사용 또는
   - GitHub Actions 설정

### 502 Bad Gateway

**원인**: Backend 서버가 시작되지 않음

**해결**:
1. Railway Backend 로그 확인
2. `package.json`의 `start` 스크립트 확인
3. 환경 변수 누락 확인

---

## 💰 비용 관리

### Railway
- **무료 크레딧**: $5 (하루 사용 충분)
- **사용량 확인**: Dashboard → **Usage** 탭
- **프로젝트 삭제**: 사용 후 삭제하면 비용 절약

### Vercel
- **무료 티어**: 개인 프로젝트 무료
- **제한**: 월 100GB 대역폭 (충분함)

---

## 🎉 배포 완료!

축하합니다! MICE 프로젝트가 성공적으로 배포되었습니다.

- **Frontend**: https://mice.vercel.app
- **Backend**: https://mice-api.up.railway.app

### 다음 단계
1. 팀원들에게 URL 공유
2. 테스트 진행
3. 피드백 수집
4. 필요시 업데이트 (Git push만 하면 자동 배포!)

---

## 📞 지원

문제가 발생하면:
- Railway 문서: https://docs.railway.app
- Vercel 문서: https://vercel.com/docs
- 프로젝트 Issues에 등록
