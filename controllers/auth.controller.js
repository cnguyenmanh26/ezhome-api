const User = require("../models/User");
const Token = require("../models/token.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

// Helper function to get frontend URL - works for all environments
const getFrontendUrl = (req) => {
  // 1. Ưu tiên: Environment variable (set trên hosting platform)
  if (process.env.FRONTEND_URL) {
    console.log("Using FRONTEND_URL from env:", process.env.FRONTEND_URL);
    return process.env.FRONTEND_URL;
  }
  
  // 2. Fallback: Detect từ referer header (Google redirect có referer)
  const referer = req.get("referer");
  if (referer) {
    try {
      const url = new URL(referer);
      const detectedUrl = `${url.protocol}//${url.host}`;
      console.log("Detected frontend URL from referer:", detectedUrl);
      return detectedUrl;
    } catch (e) {
      console.error("Invalid referer URL:", referer);
    }
  }
  
  // 3. Fallback: Detect từ origin header
  const origin = req.get("origin");
  if (origin) {
    console.log("Using origin header:", origin);
    return origin;
  }
  
  // 4. Last fallback dựa vào NODE_ENV
  const fallbackUrl = process.env.NODE_ENV === "production" 
    ? "https://ezhome.website"  // Production domain
    : "http://localhost:3000";   // Local development
  
  console.log("Using fallback URL:", fallbackUrl);
  return fallbackUrl;
};

const generateAccessToken = (user) => {
  if (!process.env.JWT_ACCESS_SECRET) {
    throw new Error("JWT_ACCESS_SECRET is not configured");
  }
  const expiresIn = process.env.JWT_ACCESS_EXPIRE || "15m";
  return jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn }
  );
};

const generateRefreshToken = (user) => {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error("JWT_REFRESH_SECRET is not configured");
  }
  const expiresInDays = parseInt(process.env.JWT_REFRESH_EXPIRE_DAYS) || 7;
  const expiresIn = `${expiresInDays}d`;
  return jwt.sign(
    { userId: user._id, type: "refresh" },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn }
  );
};

const authController = {
  register: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name, phone } = req.body;

      const user = new User({
        email,
        password,
        name: name || "",
        phone: phone || "",
      });

      await user.save();

      res.status(201).json({
        message: "User registered successfully",
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          phone: user.phone,
        },
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required" });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!user.password) {
        return res.status(401).json({
          message: "This account is linked to Google. Please use Google login.",
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      const expiresInDays = parseInt(process.env.JWT_REFRESH_EXPIRE_DAYS) || 7;

      await Token.create({
        userId: user._id,
        token: refreshToken,
        createdAt: new Date(),
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: expiresInDays * 24 * 60 * 60 * 1000,
      });

      res.json({
        message: "Login successful",
        accessToken,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          phone: user.phone,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        email: req.body?.email,
      });
      res.status(500).json({ 
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined 
      });
    }
  },

  refreshToken: async (req, res) => {
    try {
      const refreshToken =
        req.cookies?.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token required" });
      }

      // Verify refresh token JWT
      let decoded;
      try {
        decoded = jwt.verify(
          refreshToken,
          process.env.JWT_REFRESH_SECRET
        );
      } catch (error) {
        if (error.name === "TokenExpiredError") {
          await Token.deleteOne({ token: refreshToken });
          return res.status(401).json({ message: "Refresh token expired" });
        }
        return res.status(403).json({ message: "Invalid refresh token" });
      }

      // Check if token exists in database
      const tokenDoc = await Token.findOne({ token: refreshToken });
      if (!tokenDoc) {
        return res.status(403).json({ message: "Refresh token not found" });
      }

      // Verify user still exists
      const user = await User.findById(decoded.userId);
      if (!user) {
        await Token.deleteOne({ token: refreshToken });
        return res.status(403).json({ message: "User not found" });
      }

      // Generate new access token
      const accessToken = generateAccessToken(user);

      res.json({
        message: "Token refreshed successfully",
        accessToken,
      });
    } catch (error) {
      console.error("Refresh token error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },

  logout: async (req, res) => {
    try {
      const refreshToken =
        req.cookies?.refreshToken || req.body.refreshToken;

      if (refreshToken) {
        await Token.deleteOne({ token: refreshToken });
      }

      res.clearCookie("refreshToken");
      res.json({ message: "Logout successful" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },

  googleAuthCallback: async (req, res) => {
    try {
      const user = req.user;

      if (!user) {
        const frontendUrl = getFrontendUrl(req);
        return res.redirect(`${frontendUrl}?auth=login&error=auth_failed`);
      }

      const accessToken = generateAccessToken(user);
      const frontendUrl = getFrontendUrl(req);
      const redirectUrl = `${frontendUrl}/auth/callback?token=${accessToken}&userId=${user._id}`;

      res.redirect(redirectUrl);
    } catch (error) {
      console.error("Google auth callback error:", error);
      const frontendUrl = getFrontendUrl(req);
      res.redirect(`${frontendUrl}?auth=login&error=server_error`);
    }
  },
};

module.exports = authController;

