const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Album title is required.'],
      trim: true
    },
    releaseDate: {
      type: Date
    },
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artist',
      required: [true, 'Album artist is required.']
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false
  }
);

albumSchema.index({ artist: 1 });
albumSchema.index({ title: 1 });

module.exports = mongoose.model('Album', albumSchema);
