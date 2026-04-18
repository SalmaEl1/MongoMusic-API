const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Artist name is required.'],
      unique: true,
      trim: true
    },
    country: {
      type: String,
      trim: true
    },
    followers: {
      type: Number,
      min: [0, 'Followers cannot be negative.']
    },
    genres: {
      type: [
        {
          type: String,
          trim: true
        }
      ],
      default: undefined
    },
    birthDate: {
      type: Date
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

module.exports = mongoose.model('Artist', artistSchema);
