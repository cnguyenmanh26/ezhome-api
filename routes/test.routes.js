const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * @swagger
 * /api/test/verify-token:
 *   post:
 *     summary: Verify your existing token (for testing)
 *     tags: [Test]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Token is valid
 *       401:
 *         description: Token is invalid or expired
 */
router.post("/verify-token", (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    res.json({
      message: "Token is valid",
      decoded: {
        userId: decoded.userId,
        email: decoded.email,
        exp: decoded.exp,
        iat: decoded.iat,
      },
      expiresAt: new Date(decoded.exp * 1000).toISOString(),
      isValid: true,
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expired",
        error: error.message,
        expiredAt: new Date(error.expiredAt).toISOString(),
      });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Invalid token",
        error: error.message,
      });
    }
    return res.status(500).json({
      message: "Token verification error",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/test/test-protected:
 *   get:
 *     summary: Test protected route with your token
 *     tags: [Test]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully accessed protected route
 *       401:
 *         description: Unauthorized
 */
router.get("/test-protected", (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "No token provided",
        hint: "Add 'Authorization: Bearer YOUR_TOKEN' header",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    res.json({
      message: "✅ Token is valid! You can access protected routes.",
      user: {
        userId: decoded.userId,
        email: decoded.email,
      },
      tokenInfo: {
        expiresAt: new Date(decoded.exp * 1000).toISOString(),
        issuedAt: new Date(decoded.iat * 1000).toISOString(),
      },
      note: "You can use this token in other protected routes",
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "❌ Token expired",
        error: error.message,
        expiredAt: new Date(error.expiredAt).toISOString(),
      });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "❌ Invalid token",
        error: error.message,
      });
    }
    return res.status(500).json({
      message: "Token verification error",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/test/decode-token:
 *   get:
 *     summary: Decode token without verification (for inspection)
 *     tags: [Test]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: JWT token to decode
 *     responses:
 *       200:
 *         description: Token decoded successfully
 */
router.get("/decode-token", (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Token is required in query string" });
    }

    // Decode without verification (just for inspection)
    const decoded = jwt.decode(token, { complete: true });

    if (!decoded) {
      return res.status(400).json({ message: "Invalid token format" });
    }

    res.json({
      message: "Token decoded (not verified)",
      header: decoded.header,
      payload: {
        ...decoded.payload,
        exp: decoded.payload.exp
          ? new Date(decoded.payload.exp * 1000).toISOString()
          : null,
        iat: decoded.payload.iat
          ? new Date(decoded.payload.iat * 1000).toISOString()
          : null,
      },
      note: "This is just for inspection. Use /verify-token to actually verify.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Token decode error",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/test/decode-google-id-token:
 *   post:
 *     summary: Decode Google ID token (from Google OAuth response)
 *     tags: [Test]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_token
 *             properties:
 *               id_token:
 *                 type: string
 *                 description: Google ID token from OAuth response
 *     responses:
 *       200:
 *         description: Token decoded successfully
 */
router.post("/decode-google-id-token", (req, res) => {
  try {
    const { id_token } = req.body;

    if (!id_token) {
      return res.status(400).json({ message: "id_token is required" });
    }

    // Decode Google ID token (không verify vì cần Google's public keys)
    const decoded = jwt.decode(id_token, { complete: true });

    if (!decoded) {
      return res.status(400).json({ message: "Invalid token format" });
    }

    res.json({
      message: "Google ID token decoded",
      header: decoded.header,
      payload: {
        ...decoded.payload,
        exp: decoded.payload.exp
          ? new Date(decoded.payload.exp * 1000).toISOString()
          : null,
        iat: decoded.payload.iat
          ? new Date(decoded.payload.iat * 1000).toISOString()
          : null,
      },
      userInfo: {
        googleId: decoded.payload.sub,
        email: decoded.payload.email,
        name: decoded.payload.name,
        picture: decoded.payload.picture,
        emailVerified: decoded.payload.email_verified,
      },
      note: "This is Google's token. Backend will create its own JWT after verification.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Token decode error",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/test/create-backend-token-from-google:
 *   post:
 *     summary: Create backend JWT token from Google user info (for testing)
 *     tags: [Test]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - googleId
 *               - email
 *             properties:
 *               googleId:
 *                 type: string
 *                 example: 102167505131672003202
 *               email:
 *                 type: string
 *                 example: user@gmail.com
 *               name:
 *                 type: string
 *                 example: User Name
 *     responses:
 *       200:
 *         description: Backend token created successfully
 */
router.post("/create-backend-token-from-google", async (req, res) => {
  try {
    const { googleId, email, name, avatar } = req.body;

    if (!googleId || !email) {
      return res
        .status(400)
        .json({
          message: "googleId and email are required",
        });
    }

    // Tìm hoặc tạo user
    let user = await User.findOne({ googleId });

    if (!user) {
      user = await User.findOne({ email });

      if (user) {
        // Liên kết Google account
        user.googleId = googleId;
        if (avatar && !user.avatar) {
          user.avatar = avatar;
        }
        if (name && (!user.name || user.name.trim() === "")) {
          user.name = name;
        }
        await user.save();
      } else {
        // Tạo user mới
        user = await User.create({
          googleId,
          email,
          name: name || "Google User",
          avatar: avatar || null,
        });
      }
    }

    // Tạo backend JWT token
    const accessToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRE || "15m" }
    );

    res.json({
      message: "Backend JWT token created successfully",
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        googleId: user.googleId,
      },
      note: "Use this token in Authorization header: Bearer <accessToken>",
    });
  } catch (error) {
    console.error("Create backend token error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

module.exports = router;
