const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/booking.controller");
const authMiddleware = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorize");

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking (User only)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roomId
 *             properties:
 *               roomId:
 *                 type: string
 *                 description: Room ID to book
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User access required
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server error
 */
router.post(
  "/",
  authMiddleware,
  authorize(["user"]),
  bookingController.createBooking
);

/**
 * @swagger
 * /api/bookings/my-bookings:
 *   get:
 *     summary: Get my bookings (User only)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's bookings
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User access required
 *       500:
 *         description: Server error
 */
router.get(
  "/my-bookings",
  authMiddleware,
  authorize(["user"]),
  bookingController.getMyBookings
);

/**
 * @swagger
 * /api/bookings/all:
 *   get:
 *     summary: Get all bookings (Admin only)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all bookings
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.get(
  "/all",
  authMiddleware,
  authorize(["admin"]),
  bookingController.getAllBookings
);

/**
 * @swagger
 * /api/bookings/status/{id}:
 *   put:
 *     summary: Update booking status (Admin only)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, completed, cancelled]
 *     responses:
 *       200:
 *         description: Booking status updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.put(
  "/status/:id",
  authMiddleware,
  authorize(["admin"]),
  bookingController.updateBookingStatus
);

module.exports = router;

