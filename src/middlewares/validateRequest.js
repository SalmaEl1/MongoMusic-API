const { AppError } = require('./errorHandler');

const validateRequest = (validator) => (req, res, next) => {
  const errors = validator(req);

  if (errors.length > 0) {
    return next(new AppError(errors.join(' '), 400));
  }

  next();
};

module.exports = validateRequest;
