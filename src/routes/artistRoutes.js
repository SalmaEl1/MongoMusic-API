const express = require('express');
const {
  getArtists,
  getArtistById,
  createArtist,
  updateArtist,
  deleteArtist
} = require('../controllers/artistController');
const { getSongsByArtist } = require('../controllers/songController');
const validateRequest = require('../middlewares/validateRequest');
const validateObjectId = require('../middlewares/validateObjectId');
const { createArtistValidator, updateArtistValidator } = require('../middlewares/requestValidators');

const router = express.Router();

/**
 * @swagger
 * /artists:
 *   get:
 *     summary: Get all artists
 *     tags: [Artists]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by name (contains, case-insensitive).
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Filter by country (contains, case-insensitive).
 *       - in: query
 *         name: minFollowers
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Filter artists with followers >= this value.
 *       - in: query
 *         name: maxFollowers
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Filter artists with followers <= this value.
 *       - in: query
 *         name: birthDateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter artists born on or after this date (YYYY-MM-DD).
 *       - in: query
 *         name: birthDateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter artists born on or before this date (YYYY-MM-DD).
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
 *         description: Artists retrieved successfully.
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
 *                     $ref: '#/components/schemas/Artist'
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
 *     summary: Create a new artist
 *     tags: [Artists]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ArtistInput'
 *     responses:
 *       201:
 *         description: Artist created successfully.
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
 *                   example: Artist created successfully.
 *                 data:
 *                   $ref: '#/components/schemas/Artist'
 *       400:
 *         description: Validation error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Duplicate artist name.
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
  .get(getArtists)
  .post(validateRequest(createArtistValidator), createArtist);

/**
 * @swagger
 * /artists/{id}/songs:
 *   get:
 *     summary: Get all songs for a specific artist
 *     tags: [Artists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Artist ObjectId.
 *     responses:
 *       200:
 *         description: Songs for the artist retrieved successfully.
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
 *                     $ref: '#/components/schemas/Song'
 *       400:
 *         description: Invalid ObjectId format.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Artist not found.
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
router.get('/:id/songs', validateObjectId('id'), getSongsByArtist);

/**
 * @swagger
 * /artists/{id}:
 *   get:
 *     summary: Get an artist by ID
 *     tags: [Artists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Artist ObjectId.
 *     responses:
 *       200:
 *         description: Artist retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 data:
 *                   $ref: '#/components/schemas/Artist'
 *       400:
 *         description: Invalid ObjectId format.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Artist not found.
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
 *     summary: Update an artist by ID
 *     tags: [Artists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Artist ObjectId.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ArtistInput'
 *     responses:
 *       200:
 *         description: Artist updated successfully.
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
 *                   example: Artist updated successfully.
 *                 data:
 *                   $ref: '#/components/schemas/Artist'
 *       400:
 *         description: Validation error or invalid ObjectId.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Artist not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Duplicate artist name.
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
 *     summary: Delete an artist by ID
 *     tags: [Artists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Artist ObjectId.
 *     responses:
 *       200:
 *         description: Artist deleted successfully.
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
 *         description: Artist not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Artist cannot be deleted because dependent records exist.
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
  .get(validateObjectId('id'), getArtistById)
  .put(validateObjectId('id'), validateRequest(updateArtistValidator), updateArtist)
  .delete(validateObjectId('id'), deleteArtist);

module.exports = router;
