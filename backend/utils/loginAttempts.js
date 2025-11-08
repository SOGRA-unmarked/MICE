// In-memory 로그인 시도 추적 (Brute Force 방지)
const loginAttempts = new Map();

const MAX_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15분

/**
 * 실패한 로그인 시도 기록
 */
const recordFailedAttempt = (email) => {
  const attempts = loginAttempts.get(email) || { count: 0, lockedUntil: null };
  attempts.count += 1;

  if (attempts.count >= MAX_ATTEMPTS) {
    attempts.lockedUntil = Date.now() + LOCK_TIME;
  }

  loginAttempts.set(email, attempts);
};

/**
 * 계정 잠금 여부 확인
 */
const isAccountLocked = (email) => {
  const attempts = loginAttempts.get(email);

  if (!attempts) return false;

  if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
    return true;
  }

  // 잠금 시간이 지났으면 초기화
  if (attempts.lockedUntil && Date.now() >= attempts.lockedUntil) {
    loginAttempts.delete(email);
    return false;
  }

  return false;
};

/**
 * 성공한 로그인 시도 기록 초기화
 */
const resetAttempts = (email) => {
  loginAttempts.delete(email);
};

module.exports = { recordFailedAttempt, isAccountLocked, resetAttempts };
