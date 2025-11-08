const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  기존 데이터 삭제 중...');

  // 기존 데이터 모두 삭제 (순서 중요: 외래키 관계 때문에)
  await prisma.eventEntry.deleteMany({});
  await prisma.attendanceLog.deleteMany({});
  await prisma.favorite.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.sessionMaterial.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('✅ 기존 데이터 삭제 완료\n');

  // 비밀번호 해시 생성 (모든 계정 비밀번호: password123)
  const passwordHash = await bcrypt.hash('password123', 10);

  console.log('👥 사용자 생성 중...');

  // 1. Admin 계정 2개
  const admin1 = await prisma.user.create({
    data: {
      email: 'admin1@mice.com',
      passwordHash,
      name: '관리자1',
      role: 'ADMIN',
      organization: 'MICE 운영팀'
    }
  });

  const admin2 = await prisma.user.create({
    data: {
      email: 'admin2@mice.com',
      passwordHash,
      name: '관리자2',
      role: 'ADMIN',
      organization: 'MICE 운영팀'
    }
  });

  console.log('✅ Admin 계정 2개 생성 완료');

  // 2. Speaker 계정 4개
  const speaker1 = await prisma.user.create({
    data: {
      email: 'speaker1@mice.com',
      passwordHash,
      name: '김지훈',
      role: 'SPEAKER',
      organization: '서울대학교'
    }
  });

  const speaker2 = await prisma.user.create({
    data: {
      email: 'speaker2@mice.com',
      passwordHash,
      name: '이수연',
      role: 'SPEAKER',
      organization: 'KAIST'
    }
  });

  const speaker3 = await prisma.user.create({
    data: {
      email: 'speaker3@mice.com',
      passwordHash,
      name: '박민준',
      role: 'SPEAKER',
      organization: '포항공과대학교'
    }
  });

  const speaker4 = await prisma.user.create({
    data: {
      email: 'speaker4@mice.com',
      passwordHash,
      name: '최영희',
      role: 'SPEAKER',
      organization: '고려대학교'
    }
  });

  console.log('✅ Speaker 계정 4개 생성 완료');

  // 3. Attendee 계정 10개
  const attendees = [];
  const attendeeNames = [
    { name: '홍길동', org: '충남대학교' },
    { name: '김철수', org: '충북대학교' },
    { name: '이영희', org: '공주대학교' },
    { name: '박지성', org: '한밭대학교' },
    { name: '정수아', org: '목원대학교' },
    { name: '강민호', org: '배재대학교' },
    { name: '윤서연', org: '건양대학교' },
    { name: '임도현', org: '선문대학교' },
    { name: '조하늘', org: '단국대학교' },
    { name: '신지원', org: '대전대학교' }
  ];

  for (let i = 0; i < 10; i++) {
    const attendee = await prisma.user.create({
      data: {
        email: `attendee${i + 1}@mice.com`,
        passwordHash,
        name: attendeeNames[i].name,
        role: 'ATTENDEE',
        organization: attendeeNames[i].org
      }
    });
    attendees.push(attendee);
  }

  console.log('✅ Attendee 계정 10개 생성 완료\n');

  console.log('📅 세션 생성 중...');

  // 세션 시작 날짜 (내일부터)
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + 1);
  baseDate.setHours(9, 0, 0, 0);

  // 4개의 세션 생성 (각 스피커당 1개씩)
  const session1 = await prisma.session.create({
    data: {
      title: 'AI와 머신러닝의 최신 동향',
      description: '인공지능과 머신러닝 분야의 최신 연구 동향과 실무 적용 사례를 소개합니다. 딥러닝, 자연어 처리, 컴퓨터 비전 등 다양한 분야의 최신 기술을 다룹니다.',
      startTime: new Date(baseDate.getTime()),
      endTime: new Date(baseDate.getTime() + 90 * 60 * 1000), // 1.5시간
      speakerId: speaker1.id,
      track: 'AI/ML'
    }
  });

  const session2Time = new Date(baseDate.getTime() + 120 * 60 * 1000); // 2시간 후
  const session2 = await prisma.session.create({
    data: {
      title: '클라우드 네이티브 아키텍처',
      description: '클라우드 환경에서의 마이크로서비스 아키텍처 설계와 구현 방법을 살펴봅니다. Kubernetes, Docker, CI/CD 파이프라인 구축 등을 다룹니다.',
      startTime: session2Time,
      endTime: new Date(session2Time.getTime() + 90 * 60 * 1000),
      speakerId: speaker2.id,
      track: 'Cloud'
    }
  });

  const session3Time = new Date(baseDate.getTime() + 240 * 60 * 1000); // 4시간 후
  const session3 = await prisma.session.create({
    data: {
      title: '사이버 보안과 개인정보 보호',
      description: '최신 사이버 위협과 보안 솔루션을 소개하고, GDPR 및 개인정보보호법 준수 방안을 논의합니다. 실전 보안 사례 분석을 포함합니다.',
      startTime: session3Time,
      endTime: new Date(session3Time.getTime() + 90 * 60 * 1000),
      speakerId: speaker3.id,
      track: 'Security'
    }
  });

  const nextDay = new Date(baseDate);
  nextDay.setDate(nextDay.getDate() + 1);
  nextDay.setHours(10, 0, 0, 0);

  const session4 = await prisma.session.create({
    data: {
      title: '데이터 과학과 빅데이터 분석',
      description: '대규모 데이터 처리 및 분석 기법을 소개합니다. Spark, Hadoop, 데이터 시각화, 통계 분석 등 실무에 필요한 기술을 다룹니다.',
      startTime: nextDay,
      endTime: new Date(nextDay.getTime() + 90 * 60 * 1000),
      speakerId: speaker4.id,
      track: 'Data Science'
    }
  });

  console.log('✅ 세션 4개 생성 완료\n');

  console.log('⭐ 즐겨찾기 생성 중...');

  // 참석자들이 세션을 즐겨찾기 (랜덤하게)
  const favorites = [
    { userId: attendees[0].id, sessionId: session1.id },
    { userId: attendees[0].id, sessionId: session2.id },
    { userId: attendees[1].id, sessionId: session1.id },
    { userId: attendees[2].id, sessionId: session3.id },
    { userId: attendees[3].id, sessionId: session2.id },
    { userId: attendees[3].id, sessionId: session4.id },
    { userId: attendees[4].id, sessionId: session1.id },
    { userId: attendees[5].id, sessionId: session4.id },
    { userId: attendees[6].id, sessionId: session2.id },
    { userId: attendees[7].id, sessionId: session3.id },
    { userId: attendees[8].id, sessionId: session1.id },
    { userId: attendees[8].id, sessionId: session4.id },
    { userId: attendees[9].id, sessionId: session2.id },
  ];

  for (const fav of favorites) {
    await prisma.favorite.create({ data: fav });
  }

  console.log('✅ 즐겨찾기 13개 생성 완료\n');

  console.log('❓ 질문 생성 중...');

  // 각 세션에 질문 몇 개씩 추가
  const questions = [
    {
      sessionId: session1.id,
      attendeeId: attendees[0].id,
      questionText: 'GPT-4와 같은 대규모 언어 모델을 실무에 적용할 때 주의해야 할 점은 무엇인가요?'
    },
    {
      sessionId: session1.id,
      attendeeId: attendees[1].id,
      questionText: '머신러닝 모델의 편향성을 어떻게 감지하고 완화할 수 있나요?'
    },
    {
      sessionId: session2.id,
      attendeeId: attendees[3].id,
      questionText: 'Kubernetes에서 stateful 애플리케이션을 운영할 때 고려사항은?'
    },
    {
      sessionId: session2.id,
      attendeeId: attendees[6].id,
      questionText: '멀티 클라우드 환경에서 비용 최적화 전략이 궁금합니다.'
    },
    {
      sessionId: session3.id,
      attendeeId: attendees[2].id,
      questionText: 'Zero Trust 아키텍처 구현 시 가장 중요한 요소는 무엇인가요?'
    },
    {
      sessionId: session4.id,
      attendeeId: attendees[5].id,
      questionText: '실시간 데이터 처리와 배치 처리의 장단점을 비교해주세요.'
    }
  ];

  for (const q of questions) {
    await prisma.question.create({ data: q });
  }

  console.log('✅ 질문 6개 생성 완료\n');

  console.log('📊 출석 로그 생성 중...');

  // 일부 참석자들이 세션에 출석 체크
  const attendanceLogs = [
    { userId: attendees[0].id, sessionId: session1.id },
    { userId: attendees[1].id, sessionId: session1.id },
    { userId: attendees[4].id, sessionId: session1.id },
    { userId: attendees[3].id, sessionId: session2.id },
    { userId: attendees[6].id, sessionId: session2.id },
    { userId: attendees[2].id, sessionId: session3.id },
    { userId: attendees[7].id, sessionId: session3.id },
  ];

  for (const log of attendanceLogs) {
    await prisma.attendanceLog.create({ data: log });
  }

  console.log('✅ 출석 로그 7개 생성 완료\n');

  console.log('🎫 행사장 입장 기록 생성 중...');

  // 일부 참석자들이 행사장에 입장
  const eventEntries = [
    { userId: attendees[0].id },
    { userId: attendees[1].id },
    { userId: attendees[2].id },
    { userId: attendees[4].id },
    { userId: attendees[6].id },
  ];

  for (const entry of eventEntries) {
    await prisma.eventEntry.create({ data: entry });
  }

  console.log('✅ 행사장 입장 기록 5개 생성 완료\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 시연용 데이터 생성 완료!\n');
  console.log('📋 생성된 데이터 요약:');
  console.log('   • Admin: 2명 (admin1@mice.com, admin2@mice.com)');
  console.log('   • Speaker: 4명 (speaker1~4@mice.com)');
  console.log('   • Attendee: 10명 (attendee1~10@mice.com)');
  console.log('   • Session: 4개');
  console.log('   • Favorites: 13개');
  console.log('   • Questions: 6개');
  console.log('   • Attendance Logs: 7개');
  console.log('   • Event Entries: 5개\n');
  console.log('🔑 모든 계정 비밀번호: password123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ 에러 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
