const mongoose = require('mongoose');

const songSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Song title is required.'],
      trim: true
    },
    duration: {
      type: Number,
      required: [true, 'Song duration is required.'],
      validate: {
        validator: (value) => value > 0,
        message: 'Duration must be greater than 0.'
      }
    },
    releaseYear: {
      type: Number,
      validate: {
        validator: (value) => value === undefined || Number.isInteger(value),
        message: 'Release year must be an integer.'
      }
    },
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artist',
      required: [true, 'Artist is required.']
    },
    album: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Album',
      required: [true, 'Album is required.']
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

songSchema.index({ title: 1 });
songSchema.index({ releaseYear: 1 });
songSchema.index({ album: 1 });
songSchema.index({ artist: 1 });

module.exports = mongoose.model('Song', songSchema);
