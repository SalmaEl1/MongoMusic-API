const express = require('express');
const {
  getSongsPerArtist,
  getAverageDurationPerAlbum,
  getSongsByGenre
} = require('../controllers/statsController');

const router = express.Router();

/**
 * @swagger
 * /stats/songs-per-artist:
 *   get:
 *     summary: Get the number of songs grouped by artist
 *     tags: [Statistics]
 *     responses:
 *       200:
 *         description: Songs per artist statistics retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SongsPerArtistStat'
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/songs-per-artist', getSongsPerArtist);

/**
 * @swagger
 * /stats/avg-duration-per-album:
 *   get:
 *     summary: Get the average duration of songs per album
 *     tags: [Statistics]
 *     responses:
 *       200:
 *         description: Average duration per album retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AvgDurationPerAlbumStat'
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/avg-duration-per-album', getAverageDurationPerAlbum);

/**
 * @swagger
 * /stats/songs-by-genre:
 *   get:
 *     summary: Get song distribution by genre
 *     tags: [Statistics]
 *     responses:
 *       200:
 *         description: Songs by genre statistics retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SongsByGenreStat'
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/songs-by-genre', getSongsByGenre);

module.exports = router;
