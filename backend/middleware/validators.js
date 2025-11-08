const { body, param, validationResult } = require('express-validator');

// Validation 결과 확인 미들웨어
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        details: errors.array()
      }
    });
  }
  next();
};

// 회원가입 Validator
const registerValidator = [
  body('email')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .escape(),
  body('role')
    .optional()
    .isIn(['ADMIN', 'SPEAKER', 'ATTENDEE']).withMessage('Invalid role'),
  body('organization')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Organization name is too long')
    .escape(),
  validate
];

// 로그인 Validator
const loginValidator = [
  body('email')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  validate
];

// 질문 등록 Validator
const questionValidator = [
  param('id').isInt().withMessage('Invalid session ID'),
  body('questionText')
    .trim()
    .notEmpty().withMessage('Question text is required')
    .isLength({ max: 1000 }).withMessage('Question is too long (max 1000 characters)')
    .escape(),
  validate
];

// 세션 생성/수정 Validator
const sessionValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title is too long')
    .escape(),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 5000 }).withMessage('Description is too long'),
  body('startTime')
    .isISO8601().withMessage('Invalid start time format'),
  body('endTime')
    .isISO8601().withMessage('Invalid end time format')
    .custom((endTime, { req }) => {
      if (new Date(endTime) <= new Date(req.body.startTime)) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
  body('speakerId')
    .isInt().withMessage('Invalid speaker ID'),
  body('track')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Track name is too long')
    .escape(),
  validate
];

module.exports = {
  registerValidator,
  loginValidator,
  questionValidator,
  sessionValidator
};
