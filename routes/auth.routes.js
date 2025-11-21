const express = require("express");
const router = express.Router();

// Đảm bảo dotenv đã được load trước khi require passport
if (!process.env.GOOGLE_CLIENT_ID) {
  try {
    require("dotenv").config();
  } catch (e) {
    // dotenv đã được config
  }
}

const passport = require("../config/passport");
const authController = require("../controllers/auth.controller");
const { registerRules } = require("../middleware/validators");

// Kiểm tra xem Google OAuth có được cấu hình không
const isGoogleOAuthConfigured = () => {
  return (
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CALLBACK_URL
  );
};

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegisterResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 */
router.post("/register", registerRules, authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         headers:
 *           Set-Cookie:
 *             description: HttpOnly cookie containing refresh token
 *             schema:
 *               type: string
 *               example: refreshToken=abc123...; HttpOnly; Path=/; Max-Age=604800
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 */
router.post("/login", authController.login);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshTokenResponse'
 *       401:
 *         description: Unauthorized - Refresh token required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Invalid refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 */
router.post("/refresh-token", authController.refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logout successful
 *       500:
 *         description: Server error
 */
router.post("/logout", authController.logout);

// Google OAuth routes - chỉ register nếu được cấu hình
if (isGoogleOAuthConfigured()) {
  /**
   * @swagger
   * /api/auth/google:
   *   get:
   *     summary: Initiate Google OAuth login
   *     tags: [Authentication]
   *     responses:
   *       302:
   *         description: Redirects to Google OAuth consent screen
   */
  router.get(
    "/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
    })
  );

  /**
   * @swagger
   * /api/auth/google/callback:
   *   get:
   *     summary: Google OAuth callback endpoint
   *     tags: [Authentication]
   *     responses:
   *       302:
   *         description: Redirects to frontend with access token
   */
  router.get(
    "/google/callback",
    passport.authenticate("google", { session: false }),
    authController.googleAuthCallback
  );
} else {
  // Route fallback nếu Google OAuth chưa được cấu hình
  router.get("/google", (req, res) => {
    res.status(503).json({
      message: "Google OAuth chưa được cấu hình",
      hint: "Vui lòng thêm GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, và GOOGLE_CALLBACK_URL vào file .env",
    });
  });

  router.get("/google/callback", (req, res) => {
    res.status(503).json({
      message: "Google OAuth chưa được cấu hình",
      hint: "Vui lòng thêm GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, và GOOGLE_CALLBACK_URL vào file .env",
    });
  });
}

module.exports = router;

