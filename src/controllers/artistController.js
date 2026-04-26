const Album = require('../models/Album');
const Artist = require('../models/Artist');
const Song = require('../models/Song');
const asyncHandler = require('../middlewares/asyncHandler');
const { AppError, parsePositiveInteger } = require('../middlewares/errorHandler');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getArtists = asyncHandler(async (req, res) => {
  const page = parsePositiveInteger(req.query.page, 'Página', 1);
  const limit = Math.min(parsePositiveInteger(req.query.limit, 'Límite', 10), 100);
  const skip = (page - 1) * limit;
  const query = {};

  if (req.query.name) {
    const name = String(req.query.name).trim();
    if (name.length > 200) throw new AppError('El filtro de nombre es demasiado largo (máx. 200 caracteres).', 400);
    query.name = { $regex: escapeRegex(name), $options: 'i' };
  }

  const [artists, total] = await Promise.all([
    Artist.find(query).sort({ name: 1 }).skip(skip).limit(limit).lean(),
    Artist.countDocuments(query)
  ]);

  res.status(200).json({
    error: false,
    data: artists,
    pagination: {
      total,
      page,
      limit,
      pages: total === 0 ? 0 : Math.ceil(total / limit)
    }
  });
});

const getArtistById = asyncHandler(async (req, res) => {
  const artist = await Artist.findById(req.params.id).lean();

  if (!artist) {
    throw new AppError('Artista no encontrado.', 404);
  }

  res.status(200).json({
    error: false,
    data: artist
  });
});

const createArtist = asyncHandler(async (req, res) => {
  const artist = await Artist.create({
    name: req.body.name.trim()
  });

  res.status(201).json({
    error: false,
    message: 'Artist created successfully.',
    data: artist
  });
});

const updateArtist = asyncHandler(async (req, res) => {
  const artist = await Artist.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name.trim()
    },
    {
      new: true,
      runValidators: true,
      context: 'query'
    }
  ).lean();

  if (!artist) {
    throw new AppError('Artista no encontrado.', 404);
  }

  res.status(200).json({
    error: false,
    message: 'Artist updated successfully.',
    data: artist
  });
});

const deleteArtist = asyncHandler(async (req, res) => {
  const artist = await Artist.findById(req.params.id);

  if (!artist) {
    throw new AppError('Artista no encontrado.', 404);
  }

  const hasSongs = await Song.exists({ artist: req.params.id });

  if (hasSongs) {
    throw new AppError('No se puede eliminar el artista porque tiene canciones asociadas.', 409);
  }

  const hasAlbums = await Album.exists({ artist: req.params.id });

  if (hasAlbums) {
    throw new AppError('No se puede eliminar el artista porque tiene álbumes asociados.', 409);
  }

  await artist.deleteOne();

  res.status(200).json({
    error: false,
    message: 'Artist deleted successfully.'
  });
});

module.exports = {
  getArtists,
  getArtistById,
  createArtist,
  updateArtist,
  deleteArtist
};
