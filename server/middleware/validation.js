import { query, param, validationResult } from 'express-validator';

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(e => e.msg),
    });
  }
  next();
}

const validateCountryCode = [
  param('code')
    .trim()
    .isLength({ min: 2, max: 3 })
    .withMessage('Country code must be 2-3 characters')
    .isAlpha()
    .withMessage('Country code must contain only letters'),
  handleValidationErrors,
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1 and 1000'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors,
];

const validateSearch = [
  query('q')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Search query must be 1-200 characters')
    .escape(),
  handleValidationErrors,
];

const validateCategory = [
  query('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category must be under 50 characters'),
  handleValidationErrors,
];

export { validateCountryCode, validatePagination, validateSearch, validateCategory, handleValidationErrors };
