const Album = require('../models/Album');
const Artist = require('../models/Artist');
const Song = require('../models/Song');
const asyncHandler = require('../middlewares/asyncHandler');
const { AppError } = require('../middlewares/errorHandler');

const albumPopulate = {
  path: 'artist',
  select: 'name country followers genres birthDate createdAt'
};

const ensureArtistExists = async (artistId) => {
  const artist = await Artist.findById(artistId).select('_id');

  if (!artist) {
    throw new AppError('Artist reference does not exist.', 400);
  }
};

const getAlbums = asyncHandler(async (req, res) => {
  const albums = await Album.find()
    .populate(albumPopulate)
    .sort({ releaseDate: -1, title: 1 })
    .lean();

  res.status(200).json({
    error: false,
    count: albums.length,
    data: albums
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
    artist: req.body.artist,
    genre: req.body.genre?.trim()
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
      artist: req.body.artist,
      genre: req.body.genre?.trim()
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
