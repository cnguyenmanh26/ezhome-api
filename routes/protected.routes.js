const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Get user profile (Protected)
 *     tags: [Protected]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProtectedResponse'
 *       401:
 *         description: Unauthorized - Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/profile", authMiddleware, (req, res) => {
  res.json({
    message: "This is a protected route",
    user: req.user,
  });
});

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get dashboard data (Protected)
 *     tags: [Protected]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Welcome to the dashboard
 *                 userId:
 *                   type: string
 *                   example: 507f1f77bcf86cd799439011
 *                 email:
 *                   type: string
 *                   example: user@example.com
 *       401:
 *         description: Unauthorized - Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/dashboard", authMiddleware, (req, res) => {
  res.json({
    message: "Welcome to the dashboard",
    userId: req.user._id,
    email: req.user.email,
    role: req.user.role,
  });
});

module.exports = router;

