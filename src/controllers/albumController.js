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
  const limit = parsePositiveInteger(req.query.limit, 'Limit', 10);
  const skip = (page - 1) * limit;
  const query = {};

  if (req.query.title) {
    query.title = { $regex: escapeRegex(String(req.query.title).trim()), $options: 'i' };
  }

  if (req.query.artist) {
    if (!mongoose.isValidObjectId(req.query.artist)) {
      throw new AppError('artist must be a valid ObjectId.', 400);
    }
    query.artist = req.query.artist;
  }

  if (req.query.releaseDateFrom || req.query.releaseDateTo) {
    query.releaseDate = {};
    if (req.query.releaseDateFrom) {
      const date = new Date(req.query.releaseDateFrom);
      if (isNaN(date)) throw new AppError('releaseDateFrom must be a valid date.', 400);
      query.releaseDate.$gte = date;
    }
    if (req.query.releaseDateTo) {
      const date = new Date(req.query.releaseDateTo);
      if (isNaN(date)) throw new AppError('releaseDateTo must be a valid date.', 400);
      query.releaseDate.$lte = date;
    }
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
