const Song = require('../models/Song');
const asyncHandler = require('../middlewares/asyncHandler');

const getSongsPerArtist = asyncHandler(async (req, res) => {
  const stats = await Song.aggregate([
    {
      $group: {
        _id: '$artist',
        songCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'artists',
        localField: '_id',
        foreignField: '_id',
        as: 'artist'
      }
    },
    { $unwind: '$artist' },
    {
      $project: {
        _id: 0,
        artistId: { $toString: '$_id' },
        artistName: '$artist.name',
        songCount: 1
      }
    },
    {
      $sort: {
        songCount: -1,
        artistName: 1
      }
    }
  ]);

  res.status(200).json({
    error: false,
    count: stats.length,
    data: stats
  });
});

const getAverageDurationPerAlbum = asyncHandler(async (req, res) => {
  const stats = await Song.aggregate([
    {
      $group: {
        _id: '$album',
        averageDuration: { $avg: '$duration' },
        songCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'albums',
        localField: '_id',
        foreignField: '_id',
        as: 'album'
      }
    },
    { $unwind: '$album' },
    {
      $project: {
        _id: 0,
        albumId: { $toString: '$_id' },
        albumTitle: '$album.title',
        averageDuration: { $round: ['$averageDuration', 2] },
        songCount: 1
      }
    },
    {
      $sort: {
        averageDuration: -1,
        albumTitle: 1
      }
    }
  ]);

  res.status(200).json({
    error: false,
    count: stats.length,
    data: stats
  });
});

module.exports = {
  getSongsPerArtist,
  getAverageDurationPerAlbum
};
