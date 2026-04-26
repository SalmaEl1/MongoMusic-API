const mongoose = require('mongoose');

const isBlankString = (value) => typeof value !== 'string' || value.trim().length === 0;

const isValidDate = (value) => !Number.isNaN(Date.parse(value));

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const requireBody = (body, errors) => {
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length === 0) {
    errors.push('El cuerpo de la solicitud debe ser un objeto JSON no vacío.');
    return false;
  }

  return true;
};

const validateOptionalString = (value, label, errors) => {
  if (value !== undefined && isBlankString(value)) {
    errors.push(`El campo ${label} debe ser una cadena de texto no vacía.`);
  }
};

const validateRequiredString = (value, label, errors) => {
  if (value === undefined || value === null || isBlankString(value)) {
    errors.push(`El campo ${label} es obligatorio.`);
    return;
  }

  if (typeof value !== 'string') {
    errors.push(`El campo ${label} debe ser una cadena de texto.`);
  }
};

const validateOptionalDate = (value, label, errors) => {
  if (value !== undefined && value !== null && !isValidDate(value)) {
    errors.push(`El campo ${label} debe ser una fecha válida.`);
  }
};

const validateRequiredObjectId = (value, label, errors) => {
  if (!value) {
    errors.push(`El campo ${label} es obligatorio.`);
    return;
  }

  if (!isValidObjectId(value)) {
    errors.push(`El campo ${label} debe ser un ObjectId válido.`);
  }
};

const validatePositiveNumber = (value, label, errors, { required = false, allowZero = false, integer = false } = {}) => {
  if (value === undefined || value === null) {
    if (required) {
      errors.push(`El campo ${label} es obligatorio.`);
    }
    return;
  }

  if (typeof value !== 'number' || Number.isNaN(value)) {
    errors.push(`El campo ${label} debe ser un número válido.`);
    return;
  }

  if (integer && !Number.isInteger(value)) {
    errors.push(`El campo ${label} debe ser un número entero.`);
  }

  if (allowZero ? value < 0 : value <= 0) {
    errors.push(`El campo ${label} debe ser ${allowZero ? 'cero o mayor' : 'mayor que 0'}.`);
  }
};

const createArtistValidator = (req) => {
  const errors = [];
  const { body } = req;

  if (!requireBody(body, errors)) {
    return errors;
  }

  validateRequiredString(body.name, 'Nombre', errors);

  return errors;
};

const updateArtistValidator = createArtistValidator;

const createAlbumValidator = (req) => {
  const errors = [];
  const { body } = req;

  if (!requireBody(body, errors)) {
    return errors;
  }

  validateRequiredString(body.title, 'Título', errors);
  validateRequiredObjectId(body.artist, 'Artista', errors);
  validateOptionalDate(body.releaseDate, 'Fecha de lanzamiento', errors);

  return errors;
};

const updateAlbumValidator = createAlbumValidator;

const createSongValidator = (req) => {
  const errors = [];
  const { body } = req;

  if (!requireBody(body, errors)) {
    return errors;
  }

  validateRequiredString(body.title, 'Título', errors);
  validatePositiveNumber(body.duration, 'Duración', errors, { required: true });
  validatePositiveNumber(body.releaseYear, 'Año de lanzamiento', errors, { integer: true, allowZero: false });
  validateRequiredObjectId(body.artist, 'Artista', errors);
  validateRequiredObjectId(body.album, 'Álbum', errors);

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
