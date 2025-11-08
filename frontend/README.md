# MICE Frontend

충청권 MICE 행사 관리 시스템 프론트엔드

## 기술 스택

- **React** 18
- **Vite** (빌드 도구)
- **React Router** (라우팅)
- **Axios** (API 통신)
- **Tailwind CSS** (스타일링)
- **qrcode.react** (QR 코드 생성)
- **html5-qrcode** (QR 코드 스캔)

## 설치 및 실행

### 1. 의존성 설치
```bash
cd frontend
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```

서버는 `http://localhost:3000`에서 실행됩니다.

### 3. 프로덕션 빌드
```bash
npm run build
npm run preview
```

## 프로젝트 구조

```
frontend/
├── src/
│   ├── components/         # 공통 컴포넌트
│   │   ├── Navbar.jsx
│   │   └── ProtectedRoute.jsx
│   ├── context/           # Context API
│   │   └── AuthContext.jsx
│   ├── pages/             # 페이지 컴포넌트
│   │   ├── Login.jsx
│   │   ├── attendee/      # 참가자 페이지
│   │   │   ├── Dashboard.jsx
│   │   │   ├── SessionDetail.jsx
│   │   │   ├── MyPass.jsx
│   │   │   └── ScanQR.jsx
│   │   ├── speaker/       # 연사 페이지
│   │   │   ├── Dashboard.jsx
│   │   │   └── SessionDetail.jsx
│   │   └── admin/         # 관리자 페이지
│   │       ├── Dashboard.jsx
│   │       ├── Users.jsx
│   │       ├── Sessions.jsx
│   │       └── QRDisplay.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js
└── package.json
```

## 주요 기능

### 역할별 기능

#### Attendee (참가자)
- **세션 목록** (`/`) - 전체 세션 조회
- **세션 상세** (`/sessions/:id`) - 세션 상세 정보, 질문 등록, 자료 다운로드
- **나의 비표** (`/my-pass`) - 정적 QR 코드 표시 (입장용)
- **출석 스캔** (`/scan`) - 동적 QR 스캔으로 출석 체크

#### Speaker (연사)
- **내 세션** (`/speaker/dashboard`) - 본인 세션 목록
- **세션 관리** (`/speaker/sessions/:id`) - Q&A 조회, 발표 자료 업로드

#### Admin (관리자)
- **대시보드** (`/admin/dashboard`) - 통계 및 빠른 액션
- **사용자 관리** (`/admin/users`) - 사용자 CRUD
- **세션 관리** (`/admin/sessions`) - 세션 CRUD
- **동적 QR 표시** (`/admin/sessions/:id/qr-display`) - 60초마다 갱신되는 QR 코드

## 인증 시스템

### JWT 인증
- 로그인 시 JWT 토큰을 `localStorage`에 저장
- 모든 API 요청 시 `Authorization: Bearer <token>` 헤더 포함
- AuthContext를 통해 전역 상태 관리

### RBAC (Role-Based Access Control)
- ProtectedRoute 컴포넌트로 역할별 접근 제어
- 3가지 역할: ADMIN, SPEAKER, ATTENDEE

## API 통신

### Base URL
- 개발 환경: `http://localhost:3000/api` (Vite proxy가 `http://localhost:5050`로 전달)
- 프로덕션: 환경에 따라 설정

### Axios 인터셉터
```javascript
axios.get('/api/sessions', {
  headers: { Authorization: `Bearer ${token}` }
})
```

## 주요 라이브러리 사용법

### QR 코드 생성
```jsx
import { QRCodeSVG } from 'qrcode.react'

<QRCodeSVG value={userId} size={256} />
```

### QR 코드 스캔
```jsx
import { Html5QrcodeScanner } from 'html5-qrcode'

const scanner = new Html5QrcodeScanner('qr-reader', { fps: 10 })
scanner.render(onScanSuccess, onScanError)
```

## 스타일링

### Tailwind CSS
커스텀 클래스:
- `.btn-primary` - 주요 버튼
- `.btn-secondary` - 보조 버튼
- `.btn-danger` - 위험 버튼
- `.card` - 카드 컨테이너
- `.input` - 입력 필드
- `.label` - 레이블

## 환경 변수

Vite는 `VITE_` 접두사를 사용합니다.

```env
# .env
VITE_API_URL=http://localhost:5050
```

## 개발 팁

### Hot Module Replacement (HMR)
Vite는 기본적으로 HMR을 지원하여 파일 변경 시 자동으로 브라우저가 새로고침됩니다.

### React DevTools
브라우저 확장 프로그램을 설치하여 React 컴포넌트를 디버깅할 수 있습니다.
