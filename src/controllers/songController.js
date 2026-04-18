const Album = require('../models/Album');
const Artist = require('../models/Artist');
const Song = require('../models/Song');
const asyncHandler = require('../middlewares/asyncHandler');
const { AppError } = require('../middlewares/errorHandler');

const allowedSortFields = new Set(['title', 'duration', 'releaseYear', 'createdAt']);

const songPopulate = [
  {
    path: 'artist',
    select: 'name country followers genres birthDate createdAt'
  },
  {
    path: 'album',
    select: 'title releaseDate genre artist createdAt',
    populate: {
      path: 'artist',
      select: 'name country createdAt'
    }
  }
];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parsePositiveInteger = (value, fieldName, defaultValue) => {
  if (value === undefined) {
    return defaultValue;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new AppError(`${fieldName} must be a positive integer.`, 400);
  }

  return parsedValue;
};

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
  artist: String(body.artist),
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
  const limit = parsePositiveInteger(req.query.limit, 'Limit', 10);
  const sort = buildSort(req.query.sort);
  const query = {};

  if (req.query.search) {
    const safeSearch = escapeRegex(String(req.query.search).trim());
    query.$or = [{ title: { $regex: safeSearch, $options: 'i' } }];
  }

  if (req.query.releaseYear !== undefined) {
    const releaseYear = Number(req.query.releaseYear);

    if (!Number.isInteger(releaseYear)) {
      throw new AppError('releaseYear must be an integer.', 400);
    }

    query.releaseYear = releaseYear;
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
