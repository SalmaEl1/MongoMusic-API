const mongoose = require('mongoose');
const Album = require('../models/Album');
const Artist = require('../models/Artist');
const Song = require('../models/Song');
const asyncHandler = require('../middlewares/asyncHandler');
const { AppError, parsePositiveInteger } = require('../middlewares/errorHandler');

const allowedSortFields = new Set(['title', 'duration', 'releaseYear', 'createdAt']);

const MIN_YEAR = 1900;
const validateYear = (value, label) => {
  const maxYear = new Date().getFullYear() + 1;
  if (value < MIN_YEAR || value > maxYear) {
    throw new AppError(`${label} must be between ${MIN_YEAR} and ${maxYear}.`, 400);
  }
};

const songPopulate = [
  {
    path: 'artist',
    select: 'name country followers birthDate createdAt'
  },
  {
    path: 'album',
    select: 'title releaseDate artist createdAt',
    populate: {
      path: 'artist',
      select: 'name country followers birthDate createdAt'
    }
  }
];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildSort = (sortValue) => {
  if (!sortValue) {
    return { createdAt: -1 };
  }

  const fields = String(sortValue)
    .split(',')
    .map((field) => field.trim())
    .filter(Boolean);

  if (fields.length === 0) {
    return { createdAt: -1 };
  }

  const sort = {};

  for (const rawField of fields) {
    const direction = rawField.startsWith('-') ? -1 : 1;
    const field = rawField.replace(/^-/, '');

    if (!allowedSortFields.has(field)) {
      throw new AppError(`Invalid sort field "${field}".`, 400);
    }

    sort[field] = direction;
  }

  return sort;
};

const normalizeSongPayload = (body) => ({
  title: body.title.trim(),
  duration: body.duration,
  releaseYear: body.releaseYear,
  artist: body.artist,
  album: body.album
});

const ensureSongReferencesExist = async (artistId, albumId) => {
  const artist = await Artist.findById(artistId).select('_id');

  if (!artist) {
    throw new AppError('Artist reference does not exist.', 400);
  }

  const album = await Album.findById(albumId).select('_id');

  if (!album) {
    throw new AppError('Album reference does not exist.', 400);
  }
};

const fetchSongById = async (id) =>
  Song.findById(id)
    .populate(songPopulate)
    .lean();

const getSongs = asyncHandler(async (req, res) => {
  const page = parsePositiveInteger(req.query.page, 'Page', 1);
  const limit = Math.min(parsePositiveInteger(req.query.limit, 'Limit', 10), 100);
  const sort = buildSort(req.query.sort);
  const query = {};

  if (req.query.search) {
    const search = String(req.query.search).trim();
    if (search.length > 200) throw new AppError('search is too long (max 200 characters).', 400);
    query.title = { $regex: escapeRegex(search), $options: 'i' };
  }

  if (req.query.releaseYear !== undefined) {
    const releaseYear = Number(req.query.releaseYear);
    if (!Number.isInteger(releaseYear)) throw new AppError('releaseYear must be an integer.', 400);
    validateYear(releaseYear, 'releaseYear');
    query.releaseYear = releaseYear;
  } else if (req.query.minReleaseYear !== undefined || req.query.maxReleaseYear !== undefined) {
    const min = req.query.minReleaseYear !== undefined ? Number(req.query.minReleaseYear) : undefined;
    const max = req.query.maxReleaseYear !== undefined ? Number(req.query.maxReleaseYear) : undefined;
    if (min !== undefined && !Number.isInteger(min)) throw new AppError('minReleaseYear must be an integer.', 400);
    if (max !== undefined && !Number.isInteger(max)) throw new AppError('maxReleaseYear must be an integer.', 400);
    if (min !== undefined) validateYear(min, 'minReleaseYear');
    if (max !== undefined) validateYear(max, 'maxReleaseYear');
    if (min !== undefined && max !== undefined && min > max) throw new AppError('minReleaseYear cannot be greater than maxReleaseYear.', 400);
    query.releaseYear = {};
    if (min !== undefined) query.releaseYear.$gte = min;
    if (max !== undefined) query.releaseYear.$lte = max;
  }

  if (req.query.minDuration !== undefined || req.query.maxDuration !== undefined) {
    const min = req.query.minDuration !== undefined ? Number(req.query.minDuration) : undefined;
    const max = req.query.maxDuration !== undefined ? Number(req.query.maxDuration) : undefined;
    if (min !== undefined && (!Number.isFinite(min) || min <= 0)) throw new AppError('minDuration must be a positive number.', 400);
    if (max !== undefined && (!Number.isFinite(max) || max <= 0)) throw new AppError('maxDuration must be a positive number.', 400);
    if (min !== undefined && max !== undefined && min > max) throw new AppError('minDuration cannot be greater than maxDuration.', 400);
    query.duration = {};
    if (min !== undefined) query.duration.$gte = min;
    if (max !== undefined) query.duration.$lte = max;
  }

  if (req.query.artist) {
    if (!mongoose.isValidObjectId(req.query.artist)) throw new AppError('artist must be a valid ObjectId.', 400);
    query.artist = req.query.artist;
  }

  if (req.query.album) {
    if (!mongoose.isValidObjectId(req.query.album)) throw new AppError('album must be a valid ObjectId.', 400);
    query.album = req.query.album;
  }

  const skip = (page - 1) * limit;

  const [songs, total] = await Promise.all([
    Song.find(query).populate(songPopulate).sort(sort).skip(skip).limit(limit).lean(),
    Song.countDocuments(query)
  ]);

  res.status(200).json({
    error: false,
    data: songs,
    pagination: {
      total,
      page,
      limit,
      pages: total === 0 ? 0 : Math.ceil(total / limit)
    }
  });
});

const getSongById = asyncHandler(async (req, res) => {
  const song = await fetchSongById(req.params.id);

  if (!song) {
    throw new AppError('Song not found.', 404);
  }

  res.status(200).json({
    error: false,
    data: song
  });
});

const createSong = asyncHandler(async (req, res) => {
  const payload = normalizeSongPayload(req.body);

  await ensureSongReferencesExist(payload.artist, payload.album);

  const song = await Song.create(payload);
  const populatedSong = await fetchSongById(song._id);

  res.status(201).json({
    error: false,
    message: 'Song created successfully.',
    data: populatedSong
  });
});

const updateSong = asyncHandler(async (req, res) => {
  const payload = normalizeSongPayload(req.body);

  await ensureSongReferencesExist(payload.artist, payload.album);

  const song = await Song.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
    context: 'query'
  });

  if (!song) {
    throw new AppError('Song not found.', 404);
  }

  const populatedSong = await fetchSongById(song._id);

  res.status(200).json({
    error: false,
    message: 'Song updated successfully.',
    data: populatedSong
  });
});

const deleteSong = asyncHandler(async (req, res) => {
  const song = await Song.findById(req.params.id);

  if (!song) {
    throw new AppError('Song not found.', 404);
  }

  await song.deleteOne();

  res.status(200).json({
    error: false,
    message: 'Song deleted successfully.'
  });
});

const getSongsByArtist = asyncHandler(async (req, res) => {
  const artist = await Artist.findById(req.params.id).select('_id');

  if (!artist) {
    throw new AppError('Artist not found.', 404);
  }

  const songs = await Song.find({ artist: req.params.id }).populate(songPopulate).sort({ title: 1 }).lean();

  res.status(200).json({
    error: false,
    count: songs.length,
    data: songs
  });
});

const getSongsByAlbum = asyncHandler(async (req, res) => {
  const album = await Album.findById(req.params.id).select('_id');

  if (!album) {
    throw new AppError('Album not found.', 404);
  }

  const songs = await Song.find({ album: req.params.id }).populate(songPopulate).sort({ title: 1 }).lean();

  res.status(200).json({
    error: false,
    count: songs.length,
    data: songs
  });
});

module.exports = {
  getSongs,
  getSongById,
  createSong,
  updateSong,
  deleteSong,
  getSongsByArtist,
  getSongsByAlbum
};
