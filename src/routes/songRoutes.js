const express = require('express');
const {
  getSongs,
  getSongById,
  createSong,
  updateSong,
  deleteSong
} = require('../controllers/songController');
const validateRequest = require('../middlewares/validateRequest');
const validateObjectId = require('../middlewares/validateObjectId');
const { createSongValidator, updateSongValidator } = require('../middlewares/requestValidators');

const router = express.Router();

/**
 * @swagger
 * /songs:
 *   get:
 *     summary: Get all songs with filtering, search, pagination, and sorting
 *     tags: [Songs]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Filter by title (contains, case-insensitive).
 *       - in: query
 *         name: artist
 *         schema:
 *           type: string
 *         description: Filter by artist ObjectId (exact match).
 *       - in: query
 *         name: album
 *         schema:
 *           type: string
 *         description: Filter by album ObjectId (exact match).
 *       - in: query
 *         name: releaseYear
 *         schema:
 *           type: integer
 *         description: Filter by exact release year (cannot be combined with minReleaseYear/maxReleaseYear).
 *       - in: query
 *         name: minReleaseYear
 *         schema:
 *           type: integer
 *         description: Filter songs released on or after this year.
 *       - in: query
 *         name: maxReleaseYear
 *         schema:
 *           type: integer
 *         description: Filter songs released on or before this year.
 *       - in: query
 *         name: minDuration
 *         schema:
 *           type: number
 *         description: Filter songs with duration >= this value (seconds).
 *       - in: query
 *         name: maxDuration
 *         schema:
 *           type: number
 *         description: Filter songs with duration <= this value (seconds).
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           example: -releaseYear,title
 *         description: Sort by one or more fields. Prefix a field with "-" for descending order.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of results per page.
 *     responses:
 *       200:
 *         description: Songs retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Song'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Invalid query parameters.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     summary: Create a new song
 *     tags: [Songs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SongInput'
 *     responses:
 *       201:
 *         description: Song created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Song created successfully.
 *                 data:
 *                   $ref: '#/components/schemas/Song'
 *       400:
 *         description: Validation error or invalid references.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Integrity conflict.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router
  .route('/')
  .get(getSongs)
  .post(validateRequest(createSongValidator), createSong);

/**
 * @swagger
 * /songs/{id}:
 *   get:
 *     summary: Get a song by ID
 *     tags: [Songs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Song ObjectId.
 *     responses:
 *       200:
 *         description: Song retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 data:
 *                   $ref: '#/components/schemas/Song'
 *       400:
 *         description: Invalid ObjectId format.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Song not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   put:
 *     summary: Update a song by ID
 *     tags: [Songs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Song ObjectId.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SongInput'
 *     responses:
 *       200:
 *         description: Song updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Song updated successfully.
 *                 data:
 *                   $ref: '#/components/schemas/Song'
 *       400:
 *         description: Validation error, invalid ObjectId, or invalid references.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Song not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     summary: Delete a song by ID
 *     tags: [Songs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Song ObjectId.
 *     responses:
 *       200:
 *         description: Song deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid ObjectId format.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Song not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router
  .route('/:id')
  .get(validateObjectId('id'), getSongById)
  .put(validateObjectId('id'), validateRequest(updateSongValidator), updateSong)
  .delete(validateObjectId('id'), deleteSong);

module.exports = router;
