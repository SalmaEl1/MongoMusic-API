const Album = require('../models/Album');
const Artist = require('../models/Artist');
const Song = require('../models/Song');
const asyncHandler = require('../middlewares/asyncHandler');
const { AppError } = require('../middlewares/errorHandler');

const normalizeGenres = (genres) =>
  Array.isArray(genres)
    ? [...new Set(genres.map((genre) => String(genre).trim()).filter(Boolean))]
    : undefined;

const getArtists = asyncHandler(async (req, res) => {
  const artists = await Artist.find().sort({ name: 1 }).lean();

  res.status(200).json({
    error: false,
    count: artists.length,
    data: artists
  });
});

const getArtistById = asyncHandler(async (req, res) => {
  const artist = await Artist.findById(req.params.id).lean();

  if (!artist) {
    throw new AppError('Artist not found.', 404);
  }

  res.status(200).json({
    error: false,
    data: artist
  });
});

const createArtist = asyncHandler(async (req, res) => {
  const artist = await Artist.create({
    name: req.body.name.trim(),
    country: req.body.country?.trim(),
    followers: req.body.followers,
    genres: normalizeGenres(req.body.genres),
    birthDate: req.body.birthDate
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
      name: req.body.name.trim(),
      country: req.body.country?.trim(),
      followers: req.body.followers,
      genres: normalizeGenres(req.body.genres),
      birthDate: req.body.birthDate
    },
    {
      new: true,
      runValidators: true,
      context: 'query'
    }
  ).lean();

  if (!artist) {
    throw new AppError('Artist not found.', 404);
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
    throw new AppError('Artist not found.', 404);
  }

  const hasSongs = await Song.exists({ artist: req.params.id });

  if (hasSongs) {
    throw new AppError('Cannot delete artist because songs are associated with it.', 409);
  }

  const hasAlbums = await Album.exists({ artist: req.params.id });

  if (hasAlbums) {
    throw new AppError('Cannot delete artist because albums are associated with it.', 409);
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
