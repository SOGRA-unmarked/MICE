const jwt = require('jsonwebtoken');

/**
 * JWT 인증 미들웨어
 * Authorization 헤더에서 토큰을 추출하고 검증
 */
const authMiddleware = (req, res, next) => {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: { message: 'No token provided' }
      });
    }

    const token = authHeader.substring(7); // "Bearer " 제거

    // 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // req.user에 사용자 정보 주입
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: { message: 'Invalid token' }
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: { message: 'Token expired' }
      });
    }
    return res.status(500).json({
      error: { message: 'Authentication error' }
    });
  }
};

module.exports = authMiddleware;
