const mongoose = require('mongoose');
const { AppError } = require('./errorHandler');

const validateObjectId = (paramName = 'id') => (req, res, next) => {
  const value = req.params[paramName];

  if (!mongoose.Types.ObjectId.isValid(value)) {
    return next(new AppError(`Invalid ObjectId format for parameter "${paramName}".`, 400));
  }

  next();
};

module.exports = validateObjectId;
