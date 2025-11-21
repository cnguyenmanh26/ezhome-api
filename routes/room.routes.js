const express = require("express");
const router = express.Router();
const roomController = require("../controllers/room.controller");
const { uploadRoomMedia, uploadToCloudinary } = require("../middleware/multer");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     summary: Get all rooms
 *     tags: [Rooms]
 *     responses:
 *       200:
 *         description: List of rooms
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Room'
 *       500:
 *         description: Server error
 */
router.get("/", roomController.getAllRooms);

/**
 * @swagger
 * /api/rooms/{id}:
 *   get:
 *     summary: Get room by ID
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *     responses:
 *       200:
 *         description: Room details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server error
 */
router.get("/:id", roomController.getRoomById);

/**
 * @swagger
 * /api/rooms:
 *   post:
 *     summary: Create a new room (Admin only)
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - rentPrice
 *               - area
 *               - city
 *               - district
 *               - street
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               rentPrice:
 *                 type: number
 *               area:
 *                 type: number
 *               link360:
 *                 type: string
 *               city:
 *                 type: string
 *               district:
 *                 type: string
 *               street:
 *                 type: string
 *               furnitureDetails:
 *                 type: string
 *               electricityCost:
 *                 type: number
 *               waterCost:
 *                 type: number
 *               wifiCost:
 *                 type: number
 *               parkingCost:
 *                 type: number
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               videos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Room created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  uploadRoomMedia,
  uploadToCloudinary,
  roomController.createRoom
);

/**
 * @swagger
 * /api/rooms/{id}:
 *   put:
 *     summary: Update room by ID (Admin only)
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               rentPrice:
 *                 type: number
 *               area:
 *                 type: number
 *               link360:
 *                 type: string
 *               city:
 *                 type: string
 *               district:
 *                 type: string
 *               street:
 *                 type: string
 *               furnitureDetails:
 *                 type: string
 *               electricityCost:
 *                 type: number
 *               waterCost:
 *                 type: number
 *               wifiCost:
 *                 type: number
 *               parkingCost:
 *                 type: number
 *     responses:
 *       200:
 *         description: Room updated successfully
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server error
 */
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  uploadRoomMedia,
  uploadToCloudinary,
  roomController.updateRoom
);

/**
 * @swagger
 * /api/rooms/{id}:
 *   delete:
 *     summary: Delete room by ID (Admin only)
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *     responses:
 *       200:
 *         description: Room deleted successfully
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server error
 */
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  roomController.deleteRoom
);

module.exports = router;
