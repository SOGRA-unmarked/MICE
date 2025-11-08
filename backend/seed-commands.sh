#!/bin/bash

# MICE 시연용 데이터 생성 스크립트
# 기존 데이터를 모두 삭제하고 새로운 시연용 데이터를 생성합니다.

API_URL="https://mice-production.up.railway.app"

# Admin 계정으로 로그인 (기존 admin 계정이 있다고 가정)
# 만약 기존 admin이 없다면, 먼저 회원가입 API로 admin을 생성해야 합니다.

echo "🔐 Admin 로그인 중..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mice.com",
    "password": "admin123"
  }')

echo $LOGIN_RESPONSE

# JWT 토큰 추출 (응답에서 token 필드 추출)
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ 로그인 실패! 기존 admin 계정이 없거나 비밀번호가 틀렸습니다."
  echo "먼저 Railway에서 직접 시드를 실행하거나, 수동으로 admin 계정을 생성해주세요."
  exit 1
fi

echo "✅ 로그인 성공! Token: ${TOKEN:0:20}..."

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗑️  기존 데이터 삭제 시작..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. 모든 사용자 조회
echo "📋 기존 사용자 목록 조회 중..."
USERS=$(curl -s -X GET "${API_URL}/api/admin/users" \
  -H "Authorization: Bearer ${TOKEN}")

# 사용자 ID 추출 및 삭제 (admin 본인 제외)
echo "$USERS" | grep -o '"id":[0-9]*' | cut -d':' -f2 | while read -r USER_ID; do
  if [ "$USER_ID" != "1" ]; then  # admin 본인은 제외
    echo "🗑️  사용자 ID ${USER_ID} 삭제 중..."
    curl -s -X DELETE "${API_URL}/api/admin/users/${USER_ID}" \
      -H "Authorization: Bearer ${TOKEN}" > /dev/null
  fi
done

# 2. 모든 세션 조회 및 삭제
echo "📋 기존 세션 목록 조회 중..."
SESSIONS=$(curl -s -X GET "${API_URL}/api/admin/sessions" \
  -H "Authorization: Bearer ${TOKEN}")

echo "$SESSIONS" | grep -o '"id":[0-9]*' | cut -d':' -f2 | while read -r SESSION_ID; do
  echo "🗑️  세션 ID ${SESSION_ID} 삭제 중..."
  curl -s -X DELETE "${API_URL}/api/admin/sessions/${SESSION_ID}" \
    -H "Authorization: Bearer ${TOKEN}" > /dev/null
done

echo ""
echo "✅ 기존 데이터 삭제 완료!"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "👥 새로운 사용자 생성 시작..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Admin 계정 2개 생성
echo "📝 Admin 1 생성 중..."
curl -s -X POST "${API_URL}/api/admin/users" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin1@mice.com",
    "password": "password123",
    "name": "관리자1",
    "role": "ADMIN",
    "organization": "MICE 운영팀"
  }' > /dev/null

echo "📝 Admin 2 생성 중..."
curl -s -X POST "${API_URL}/api/admin/users" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin2@mice.com",
    "password": "password123",
    "name": "관리자2",
    "role": "ADMIN",
    "organization": "MICE 운영팀"
  }' > /dev/null

echo "✅ Admin 2명 생성 완료"
echo ""

# Speaker 계정 4개 생성
echo "📝 Speaker 1 생성 중..."
SPEAKER1=$(curl -s -X POST "${API_URL}/api/admin/users" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "speaker1@mice.com",
    "password": "password123",
    "name": "김지훈",
    "role": "SPEAKER",
    "organization": "서울대학교"
  }')
SPEAKER1_ID=$(echo $SPEAKER1 | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

echo "📝 Speaker 2 생성 중..."
SPEAKER2=$(curl -s -X POST "${API_URL}/api/admin/users" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "speaker2@mice.com",
    "password": "password123",
    "name": "이수연",
    "role": "SPEAKER",
    "organization": "KAIST"
  }')
SPEAKER2_ID=$(echo $SPEAKER2 | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

echo "📝 Speaker 3 생성 중..."
SPEAKER3=$(curl -s -X POST "${API_URL}/api/admin/users" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "speaker3@mice.com",
    "password": "password123",
    "name": "박민준",
    "role": "SPEAKER",
    "organization": "포항공과대학교"
  }')
SPEAKER3_ID=$(echo $SPEAKER3 | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

echo "📝 Speaker 4 생성 중..."
SPEAKER4=$(curl -s -X POST "${API_URL}/api/admin/users" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "speaker4@mice.com",
    "password": "password123",
    "name": "최영희",
    "role": "SPEAKER",
    "organization": "고려대학교"
  }')
SPEAKER4_ID=$(echo $SPEAKER4 | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

echo "✅ Speaker 4명 생성 완료"
echo ""

# Attendee 계정 10개 생성
echo "📝 Attendee 생성 중..."

ATTENDEE_NAMES=("홍길동:충남대학교" "김철수:충북대학교" "이영희:공주대학교" "박지성:한밭대학교" "정수아:목원대학교" "강민호:배재대학교" "윤서연:건양대학교" "임도현:선문대학교" "조하늘:단국대학교" "신지원:대전대학교")

for i in {1..10}; do
  IFS=':' read -r NAME ORG <<< "${ATTENDEE_NAMES[$((i-1))]}"
  echo "📝 Attendee ${i} (${NAME}) 생성 중..."
  curl -s -X POST "${API_URL}/api/admin/users" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"attendee${i}@mice.com\",
      \"password\": \"password123\",
      \"name\": \"${NAME}\",
      \"role\": \"ATTENDEE\",
      \"organization\": \"${ORG}\"
    }" > /dev/null
done

echo "✅ Attendee 10명 생성 완료"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📅 세션 생성 시작..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 세션 시작 시간 계산 (내일 오전 9시)
TOMORROW=$(date -u -v+1d +"%Y-%m-%dT09:00:00Z")
TOMORROW_11=$(date -u -v+1d +"%Y-%m-%dT10:30:00Z")
TOMORROW_14=$(date -u -v+1d +"%Y-%m-%dT13:00:00Z")
TOMORROW_16=$(date -u -v+1d +"%Y-%m-%dT14:30:00Z")
NEXTDAY=$(date -u -v+2d +"%Y-%m-%dT10:00:00Z")
NEXTDAY_12=$(date -u -v+2d +"%Y-%m-%dT11:30:00Z")

echo "📝 세션 1 생성 중..."
curl -s -X POST "${API_URL}/api/admin/sessions" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"AI와 머신러닝의 최신 동향\",
    \"description\": \"인공지능과 머신러닝 분야의 최신 연구 동향과 실무 적용 사례를 소개합니다. 딥러닝, 자연어 처리, 컴퓨터 비전 등 다양한 분야의 최신 기술을 다룹니다.\",
    \"startTime\": \"${TOMORROW}\",
    \"endTime\": \"${TOMORROW_11}\",
    \"speakerId\": ${SPEAKER1_ID},
    \"track\": \"AI/ML\"
  }" > /dev/null

echo "📝 세션 2 생성 중..."
curl -s -X POST "${API_URL}/api/admin/sessions" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"클라우드 네이티브 아키텍처\",
    \"description\": \"클라우드 환경에서의 마이크로서비스 아키텍처 설계와 구현 방법을 살펴봅니다. Kubernetes, Docker, CI/CD 파이프라인 구축 등을 다룹니다.\",
    \"startTime\": \"${TOMORROW_11}\",
    \"endTime\": \"${TOMORROW_14}\",
    \"speakerId\": ${SPEAKER2_ID},
    \"track\": \"Cloud\"
  }" > /dev/null

echo "📝 세션 3 생성 중..."
curl -s -X POST "${API_URL}/api/admin/sessions" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"사이버 보안과 개인정보 보호\",
    \"description\": \"최신 사이버 위협과 보안 솔루션을 소개하고, GDPR 및 개인정보보호법 준수 방안을 논의합니다. 실전 보안 사례 분석을 포함합니다.\",
    \"startTime\": \"${TOMORROW_14}\",
    \"endTime\": \"${TOMORROW_16}\",
    \"speakerId\": ${SPEAKER3_ID},
    \"track\": \"Security\"
  }" > /dev/null

echo "📝 세션 4 생성 중..."
curl -s -X POST "${API_URL}/api/admin/sessions" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"데이터 과학과 빅데이터 분석\",
    \"description\": \"대규모 데이터 처리 및 분석 기법을 소개합니다. Spark, Hadoop, 데이터 시각화, 통계 분석 등 실무에 필요한 기술을 다룹니다.\",
    \"startTime\": \"${NEXTDAY}\",
    \"endTime\": \"${NEXTDAY_12}\",
    \"speakerId\": ${SPEAKER4_ID},
    \"track\": \"Data Science\"
  }" > /dev/null

echo "✅ 세션 4개 생성 완료"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 시연용 데이터 생성 완료!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 생성된 데이터 요약:"
echo "   • Admin: 2명 (admin1@mice.com, admin2@mice.com)"
echo "   • Speaker: 4명 (speaker1~4@mice.com)"
echo "   • Attendee: 10명 (attendee1~10@mice.com)"
echo "   • Session: 4개"
echo ""
echo "🔑 모든 계정 비밀번호: password123"
echo ""
echo "⚠️  참고: 즐겨찾기, 질문, 출석 로그는 API로 생성할 수 없어"
echo "   사용자가 직접 로그인해서 추가해야 합니다."
echo ""
