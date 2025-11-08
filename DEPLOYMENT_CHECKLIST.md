# ✅ MICE 프로젝트 배포 체크리스트

**배포 URL**: `https://mice.vercel.app`

배포 전, 배포 중, 배포 후에 확인해야 할 사항들입니다.

---

## 📦 배포 전 체크리스트

### 코드 준비
- [ ] 모든 변경사항이 Git에 커밋됨
- [ ] `.env` 파일이 `.gitignore`에 포함됨
- [ ] `node_modules/`가 `.gitignore`에 포함됨
- [ ] 로컬에서 테스트 완료
  ```bash
  # Backend 테스트
  cd backend && npm run dev

  # Frontend 테스트
  cd frontend && npm run dev
  ```

### GitHub 준비
- [ ] GitHub 저장소 생성
- [ ] 코드 푸시 완료
  ```bash
  git add .
  git commit -m "Ready for deployment"
  git push origin main
  ```

### 계정 준비
- [ ] Railway 계정 생성 (GitHub 연동)
- [ ] Vercel 계정 생성 (GitHub 연동)
- [ ] 신용카드 등록 (Railway - $5 무료 크레딧)

---

## 🚂 Railway Backend 배포 체크리스트

### 1. 프로젝트 생성
- [ ] Railway에서 **New Project** 생성
- [ ] GitHub 저장소 연결
- [ ] Root Directory를 `backend`로 설정

### 2. PostgreSQL 추가
- [ ] **Add PostgreSQL** 클릭
- [ ] 데이터베이스 자동 생성 확인
- [ ] `DATABASE_URL` 환경 변수 자동 연결 확인

### 3. 환경 변수 설정
- [ ] `JWT_SECRET` = `mice-secret-key-2024`
- [ ] `PORT` = `5050`
- [ ] `NODE_ENV` = `production`
- [ ] `FRONTEND_URL` = `https://mice.vercel.app` (Vercel 배포 후 업데이트)

### 4. 배포 확인
- [ ] Deployment 로그에서 에러 없는지 확인
- [ ] Prisma 마이그레이션 성공 확인
- [ ] Generate Domain 클릭하여 URL 생성
- [ ] Backend URL 메모 (예: `https://mice-api.up.railway.app`)

### 5. Health Check
```bash
# Backend URL로 변경
curl https://mice-api.up.railway.app/api/health
```
- [ ] `{"status": "OK"}` 응답 확인

---

## ⚡ Vercel Frontend 배포 체크리스트

### 1. 프로젝트 생성
- [ ] Vercel에서 **New Project** 생성
- [ ] GitHub 저장소 선택
- [ ] Framework를 Vite로 자동 감지 확인

### 2. 프로젝트 설정
- [ ] Root Directory를 `frontend`로 설정
- [ ] Build Command: `npm run build` 확인
- [ ] Output Directory: `dist` 확인

### 3. 환경 변수 설정
- [ ] `VITE_API_URL` = Railway Backend URL (예: `https://mice-api.up.railway.app`)

### 4. 배포 실행
- [ ] **Deploy** 버튼 클릭
- [ ] 배포 로그에서 에러 없는지 확인
- [ ] 2-3분 대기

### 5. 배포 확인
- [ ] Frontend URL 확인 (예: `https://mice.vercel.app`)
- [ ] 로그인 페이지 표시 확인
- [ ] 브라우저 콘솔에 CORS 에러 없는지 확인

---

## 🔄 Backend CORS 업데이트

Vercel URL이 확정되었으므로:

### Railway에서 환경 변수 업데이트
- [ ] Railway Backend 서비스 → **Variables** 탭
- [ ] `FRONTEND_URL` 값을 Vercel URL로 변경
  - 예: `https://mice.vercel.app`
- [ ] 자동 재배포 확인 (1-2분)

---

## 👥 초기 데이터 생성

### 테스트 사용자 생성

**먼저 Backend API URL 확인:**

1. Railway Dashboard → **Backend 서비스** 클릭 (PostgreSQL ❌, Backend ✅)
2. **Settings** → **Public Networking** → **Generate Domain**
3. URL 복사 (예: `https://web-production-xxxx.up.railway.app`)

⚠️ **주의**: `postgres-production-xxxx`는 DB URL입니다. Backend URL이 아닙니다!

---

**방법 1: 터미널에서 curl 사용 (추천)**

본인의 **Mac 터미널**을 열고:

```bash
# ⚠️ YOUR_BACKEND_URL을 위에서 복사한 Backend URL로 변경하세요!
BACKEND_URL="YOUR_BACKEND_URL"

# Admin 계정
curl -X POST $BACKEND_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mice.com",
    "password": "admin123",
    "name": "관리자",
    "role": "ADMIN"
  }'

# Speaker 계정
curl -X POST $BACKEND_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "speaker@mice.com",
    "password": "speaker123",
    "name": "연사",
    "role": "SPEAKER"
  }'

# Attendee 계정
curl -X POST $BACKEND_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "attendee@mice.com",
    "password": "attendee123",
    "name": "참가자",
    "role": "ATTENDEE"
  }'
```

**방법 2: Postman 사용**
- Postman 다운로드: https://www.postman.com/downloads/
- POST 요청으로 동일한 내용 전송

체크리스트:
- [ ] Admin 계정 생성 성공 (응답: `{"message":"User created successfully"}`)
- [ ] Speaker 계정 생성 성공
- [ ] Attendee 계정 생성 성공

> 💡 **어디서 실행?** 본인 컴퓨터의 터미널 (Railway 사이트에서 실행하는 게 아닙니다!)

---

## 🧪 전체 시스템 테스트

### 1. 로그인 테스트
- [ ] Frontend에서 `admin@mice.com` / `admin123` 로그인
- [ ] 관리자 대시보드 접속 확인
- [ ] 로그아웃 후 `speaker@mice.com` / `speaker123` 로그인
- [ ] 로그아웃 후 `attendee@mice.com` / `attendee123` 로그인

### 2. Admin 기능 테스트
- [ ] 사용자 목록 조회
- [ ] 새 사용자 생성
- [ ] 세션 목록 조회
- [ ] 새 세션 생성 (Speaker 할당)

### 3. Speaker 기능 테스트
- [ ] 내 세션 목록 조회
- [ ] 발표 자료 업로드 (파일 업로드 테스트)
- [ ] Q&A 조회

### 4. Attendee 기능 테스트
- [ ] 세션 목록 조회
- [ ] 세션 상세 보기
- [ ] 질문 등록
- [ ] 나의 비표 QR 표시 확인

### 5. 동적 QR 테스트
- [ ] Admin에서 세션의 "동적 QR 표시" 클릭
- [ ] QR 코드 표시 확인
- [ ] 60초 후 QR 코드 자동 갱신 확인

---

## 🔒 보안 체크리스트

### Backend (Railway)
- [ ] HTTPS로 접속됨 (`https://`)
- [ ] 환경 변수가 안전하게 저장됨 (Railway Dashboard)
- [ ] `.env` 파일이 GitHub에 없음
- [ ] CORS가 Vercel URL만 허용
- [ ] PostgreSQL이 Private Network로 연결됨

### Frontend (Vercel)
- [ ] HTTPS로 접속됨 (`https://`)
- [ ] 환경 변수가 Vercel Dashboard에 저장됨
- [ ] `.env` 파일이 GitHub에 없음
- [ ] 보안 헤더 적용됨 (vercel.json)
- [ ] API 키가 노출되지 않음

---

## 📊 모니터링 설정

### Railway
- [ ] Metrics 탭에서 리소스 사용량 확인
- [ ] Deployments 탭 북마크
- [ ] Logs 실시간 확인 가능 여부

### Vercel
- [ ] Analytics 탭 확인
- [ ] Deployment 히스토리 확인
- [ ] Real-time Logs 접근 가능 여부

---

## 💰 비용 확인

### Railway
- [ ] 무료 크레딧 $5 확인
- [ ] Usage 탭에서 사용량 모니터링
- [ ] 하루 사용 후 프로젝트 삭제 계획 (선택)

### Vercel
- [ ] 무료 티어 제한 확인 (100GB/월)
- [ ] 현재 사용량 확인

---

## 🚀 최종 확인

- [ ] Frontend URL: `https://mice.vercel.app` 접속 가능
- [ ] Backend URL: `https://mice-api.up.railway.app` 접속 가능
- [ ] 모든 기능 정상 작동
- [ ] 브라우저 콘솔에 에러 없음
- [ ] 네트워크 탭에서 API 호출 성공 확인
- [ ] 모바일에서도 정상 작동 확인

---

## 📱 팀원/사용자 공유

배포가 완료되면 다음 정보를 공유:

### 공유할 정보
```
🎉 MICE 프로젝트 배포 완료!

📱 접속 URL: https://mice.vercel.app

👤 테스트 계정:
- Admin: admin@mice.com / admin123
- Speaker: speaker@mice.com / speaker123
- Attendee: attendee@mice.com / attendee123

💡 사용 가이드:
1. Admin: 사용자/세션 관리
2. Speaker: 세션 자료 업로드, Q&A 확인
3. Attendee: 세션 참여, QR 출석 체크
```

- [ ] 팀원에게 URL 공유
- [ ] 테스트 계정 정보 공유
- [ ] 사용 가이드 공유

---

## 🔄 업데이트 프로세스

### 코드 수정 후 재배포
```bash
# 로컬에서 코드 수정 후
git add .
git commit -m "Update: 설명"
git push origin main
```

- [ ] Railway 자동 재배포 확인 (1-2분)
- [ ] Vercel 자동 재배포 확인 (1-2분)
- [ ] 변경사항 테스트

---

## 📝 배포 완료 후 작업

- [ ] 배포 URL을 프로젝트 README.md에 추가
- [ ] 팀 채팅방에 배포 완료 알림
- [ ] 사용자 피드백 수집 계획
- [ ] 하루 사용 후 Railway 프로젝트 삭제 (선택)

---

## 🆘 문제 발생 시

### Railway 로그 확인
```
Railway Dashboard → Backend Service → Deployments → 최신 배포 클릭
```

### Vercel 로그 확인
```
Vercel Dashboard → Project → Deployments → 최신 배포 클릭
```

### 일반적인 문제
1. **CORS 에러** → Backend `FRONTEND_URL` 확인
2. **API 연결 실패** → Frontend `VITE_API_URL` 확인
3. **DB 연결 실패** → Railway PostgreSQL 연결 확인
4. **빌드 실패** → GitHub에 `node_modules/` 없는지 확인

---

**배포 가이드**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) 참고
