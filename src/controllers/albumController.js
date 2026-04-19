const mongoose = require('mongoose');
const Album = require('../models/Album');
const Artist = require('../models/Artist');
const Song = require('../models/Song');
const asyncHandler = require('../middlewares/asyncHandler');
const { AppError, parsePositiveInteger } = require('../middlewares/errorHandler');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const albumPopulate = {
  path: 'artist',
  select: 'name country followers birthDate createdAt'
};

const ensureArtistExists = async (artistId) => {
  const artist = await Artist.findById(artistId).select('_id');

  if (!artist) {
    throw new AppError('Artist reference does not exist.', 400);
  }
};

const getAlbums = asyncHandler(async (req, res) => {
  const page = parsePositiveInteger(req.query.page, 'Page', 1);
  const limit = Math.min(parsePositiveInteger(req.query.limit, 'Limit', 10), 100);
  const skip = (page - 1) * limit;
  const query = {};

  if (req.query.title) {
    const title = String(req.query.title).trim();
    if (title.length > 200) throw new AppError('title filter is too long (max 200 characters).', 400);
    query.title = { $regex: escapeRegex(title), $options: 'i' };
  }

  if (req.query.artist) {
    if (!mongoose.isValidObjectId(req.query.artist)) {
      throw new AppError('artist must be a valid ObjectId.', 400);
    }
    query.artist = req.query.artist;
  }

  if (req.query.releaseDateFrom || req.query.releaseDateTo) {
    const from = req.query.releaseDateFrom ? new Date(req.query.releaseDateFrom) : undefined;
    const to = req.query.releaseDateTo ? new Date(req.query.releaseDateTo) : undefined;
    if (from && isNaN(from)) throw new AppError('releaseDateFrom must be a valid date.', 400);
    if (to && isNaN(to)) throw new AppError('releaseDateTo must be a valid date.', 400);
    if (from && to && from > to) throw new AppError('releaseDateFrom cannot be after releaseDateTo.', 400);
    query.releaseDate = {};
    if (from) query.releaseDate.$gte = from;
    if (to) query.releaseDate.$lte = to;
  }

  const [albums, total] = await Promise.all([
    Album.find(query).populate(albumPopulate).sort({ releaseDate: -1, title: 1 }).skip(skip).limit(limit).lean(),
    Album.countDocuments(query)
  ]);

  res.status(200).json({
    error: false,
    data: albums,
    pagination: {
      total,
      page,
      limit,
      pages: total === 0 ? 0 : Math.ceil(total / limit)
    }
  });
});

const getAlbumById = asyncHandler(async (req, res) => {
  const album = await Album.findById(req.params.id).populate(albumPopulate).lean();

  if (!album) {
    throw new AppError('Album not found.', 404);
  }

  res.status(200).json({
    error: false,
    data: album
  });
});

const createAlbum = asyncHandler(async (req, res) => {
  await ensureArtistExists(req.body.artist);

  const album = await Album.create({
    title: req.body.title.trim(),
    releaseDate: req.body.releaseDate,
    artist: req.body.artist
  });

  const populatedAlbum = await Album.findById(album._id).populate(albumPopulate).lean();

  res.status(201).json({
    error: false,
    message: 'Album created successfully.',
    data: populatedAlbum
  });
});

const updateAlbum = asyncHandler(async (req, res) => {
  await ensureArtistExists(req.body.artist);

  const album = await Album.findByIdAndUpdate(
    req.params.id,
    {
      title: req.body.title.trim(),
      releaseDate: req.body.releaseDate,
      artist: req.body.artist
    },
    {
      new: true,
      runValidators: true,
      context: 'query'
    }
  )
    .populate(albumPopulate)
    .lean();

  if (!album) {
    throw new AppError('Album not found.', 404);
  }

  res.status(200).json({
    error: false,
    message: 'Album updated successfully.',
    data: album
  });
});

const deleteAlbum = asyncHandler(async (req, res) => {
  const album = await Album.findById(req.params.id);

  if (!album) {
    throw new AppError('Album not found.', 404);
  }

  const hasSongs = await Song.exists({ album: req.params.id });

  if (hasSongs) {
    throw new AppError('Cannot delete album because songs are associated with it.', 409);
  }

  await album.deleteOne();

  res.status(200).json({
    error: false,
    message: 'Album deleted successfully.'
  });
});

module.exports = {
  getAlbums,
  getAlbumById,
  createAlbum,
  updateAlbum,
  deleteAlbum
};
