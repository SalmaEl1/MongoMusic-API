const Album = require('../models/Album');
const Artist = require('../models/Artist');
const Song = require('../models/Song');
const asyncHandler = require('../middlewares/asyncHandler');
const { AppError, parsePositiveInteger } = require('../middlewares/errorHandler');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getArtists = asyncHandler(async (req, res) => {
  const page = parsePositiveInteger(req.query.page, 'Page', 1);
  const limit = parsePositiveInteger(req.query.limit, 'Limit', 10);
  const skip = (page - 1) * limit;
  const query = {};

  if (req.query.name) {
    query.name = { $regex: escapeRegex(String(req.query.name).trim()), $options: 'i' };
  }

  if (req.query.country) {
    query.country = { $regex: escapeRegex(String(req.query.country).trim()), $options: 'i' };
  }

  if (req.query.minFollowers !== undefined || req.query.maxFollowers !== undefined) {
    query.followers = {};
    if (req.query.minFollowers !== undefined) {
      const min = Number(req.query.minFollowers);
      if (!Number.isFinite(min) || min < 0) throw new AppError('minFollowers must be a non-negative number.', 400);
      query.followers.$gte = min;
    }
    if (req.query.maxFollowers !== undefined) {
      const max = Number(req.query.maxFollowers);
      if (!Number.isFinite(max) || max < 0) throw new AppError('maxFollowers must be a non-negative number.', 400);
      query.followers.$lte = max;
    }
  }

  if (req.query.birthDateFrom || req.query.birthDateTo) {
    query.birthDate = {};
    if (req.query.birthDateFrom) {
      const date = new Date(req.query.birthDateFrom);
      if (isNaN(date)) throw new AppError('birthDateFrom must be a valid date.', 400);
      query.birthDate.$gte = date;
    }
    if (req.query.birthDateTo) {
      const date = new Date(req.query.birthDateTo);
      if (isNaN(date)) throw new AppError('birthDateTo must be a valid date.', 400);
      query.birthDate.$lte = date;
    }
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
