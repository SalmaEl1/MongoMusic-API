const mongoose = require('mongoose');
const { AppError } = require('./errorHandler');

const validateObjectId = (paramName = 'id') => (req, res, next) => {
  const value = req.params[paramName];

  if (!mongoose.Types.ObjectId.isValid(value)) {
    return next(new AppError(`Formato de ObjectId inválido para el parámetro "${paramName}".`, 400));
  }

  next();
};

module.exports = validateObjectId;
