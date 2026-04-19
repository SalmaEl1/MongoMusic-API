const mongoose = require('mongoose');

const isBlankString = (value) => typeof value !== 'string' || value.trim().length === 0;

const isValidDate = (value) => !Number.isNaN(Date.parse(value));

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const requireBody = (body, errors) => {
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length === 0) {
    errors.push('Request body must be a non-empty JSON object.');
    return false;
  }

  return true;
};

const validateOptionalString = (value, label, errors) => {
  if (value !== undefined && isBlankString(value)) {
    errors.push(`${label} must be a non-empty string.`);
  }
};

const validateRequiredString = (value, label, errors) => {
  if (value === undefined || value === null || isBlankString(value)) {
    errors.push(`${label} is required.`);
    return;
  }

  if (typeof value !== 'string') {
    errors.push(`${label} must be a string.`);
  }
};

const validateOptionalDate = (value, label, errors) => {
  if (value !== undefined && value !== null && !isValidDate(value)) {
    errors.push(`${label} must be a valid date.`);
  }
};

const validateRequiredObjectId = (value, label, errors) => {
  if (!value) {
    errors.push(`${label} is required.`);
    return;
  }

  if (!isValidObjectId(value)) {
    errors.push(`${label} must be a valid ObjectId.`);
  }
};

const validatePositiveNumber = (value, label, errors, { required = false, allowZero = false, integer = false } = {}) => {
  if (value === undefined || value === null) {
    if (required) {
      errors.push(`${label} is required.`);
    }
    return;
  }

  if (typeof value !== 'number' || Number.isNaN(value)) {
    errors.push(`${label} must be a valid number.`);
    return;
  }

  if (integer && !Number.isInteger(value)) {
    errors.push(`${label} must be an integer.`);
  }

  if (allowZero ? value < 0 : value <= 0) {
    errors.push(`${label} must be ${allowZero ? 'zero or greater' : 'greater than 0'}.`);
  }
};

const createArtistValidator = (req) => {
  const errors = [];
  const { body } = req;

  if (!requireBody(body, errors)) {
    return errors;
  }

  validateRequiredString(body.name, 'Name', errors);
  validateOptionalString(body.country, 'Country', errors);
  validatePositiveNumber(body.followers, 'Followers', errors, { allowZero: true, integer: true });
  validateOptionalDate(body.birthDate, 'Birth date', errors);

  return errors;
};

const updateArtistValidator = createArtistValidator;

const createAlbumValidator = (req) => {
  const errors = [];
  const { body } = req;

  if (!requireBody(body, errors)) {
    return errors;
  }

  validateRequiredString(body.title, 'Title', errors);
  validateRequiredObjectId(body.artist, 'Artist', errors);
  validateOptionalDate(body.releaseDate, 'Release date', errors);

  return errors;
};

const updateAlbumValidator = createAlbumValidator;

const createSongValidator = (req) => {
  const errors = [];
  const { body } = req;

  if (!requireBody(body, errors)) {
    return errors;
  }

  validateRequiredString(body.title, 'Title', errors);
  validatePositiveNumber(body.duration, 'Duration', errors, { required: true });
  validatePositiveNumber(body.releaseYear, 'Release year', errors, { integer: true, allowZero: false });
  validateRequiredObjectId(body.artist, 'Artist', errors);
  validateRequiredObjectId(body.album, 'Album', errors);

  return errors;
};

const updateSongValidator = createSongValidator;

module.exports = {
  createArtistValidator,
  updateArtistValidator,
  createAlbumValidator,
  updateAlbumValidator,
  createSongValidator,
  updateSongValidator
};
