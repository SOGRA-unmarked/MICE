/**
 * RBAC (Role-Based Access Control) 미들웨어
 * authMiddleware 이후에 사용되어야 함
 */

/**
 * Admin 역할 체크
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: { message: 'Authentication required' }
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: { message: 'Admin access required' }
    });
  }

  next();
};

/**
 * Speaker 역할 체크
 */
const isSpeaker = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: { message: 'Authentication required' }
    });
  }

  if (req.user.role !== 'SPEAKER') {
    return res.status(403).json({
      error: { message: 'Speaker access required' }
    });
  }

  next();
};

/**
 * Attendee 역할 체크
 */
const isAttendee = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: { message: 'Authentication required' }
    });
  }

  if (req.user.role !== 'ATTENDEE') {
    return res.status(403).json({
      error: { message: 'Attendee access required' }
    });
  }

  next();
};

/**
 * 여러 역할 중 하나라도 매칭되면 허용
 */
const hasRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: { message: 'Authentication required' }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: { message: `Access denied. Required roles: ${roles.join(', ')}` }
      });
    }

    next();
  };
};

module.exports = {
  isAdmin,
  isSpeaker,
  isAttendee,
  hasRole
};
