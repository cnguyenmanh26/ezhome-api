const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const passport = require("./config/passport");
const connectDB = require("./config/db");
const { swaggerSetup } = require("./config/swagger");
const indexRoutes = require("./routes/index");
const authRoutes = require("./routes/auth.routes");
const protectedRoutes = require("./routes/protected.routes");
const testRoutes = require("./routes/test.routes");
const roomRoutes = require("./routes/room.routes");
const bookingRoutes = require("./routes/booking.routes");
const homeRoutes = require("./routes/home.routes");
const locationRoutes = require("./routes/location.routes");
const errorHandler = require("./utils/errorHandler");

dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "MONGODB_URI",
];

const optionalEnvVars = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_CALLBACK_URL",
  "FRONTEND_URL",
  "FRONTEND_URL_PROD",
  "FRONTEND_URL_DEV",
];

const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);

if (missingEnvVars.length > 0) {
  console.error(
    `❌ Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
  console.error("Please check your .env file");
  process.exit(1);
}

const missingOptionalEnvVars = optionalEnvVars.filter(
  (varName) => !process.env[varName]
);
if (missingOptionalEnvVars.length > 0) {
  console.warn(
    `⚠️  Missing optional environment variables (Google OAuth may not work): ${missingOptionalEnvVars.join(
      ", "
    )}`
  );
}

const app = express();
const port = process.env.PORT || 5000;

// Cấu hình CORS động dựa trên môi trường
const corsOptions = {
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  origin: (origin, callback) => {
    // Trong development, cho phép tất cả
    if (process.env.NODE_ENV !== "production") {
      console.log("CORS: Allowing origin (dev mode):", origin || "same-origin");
      callback(null, true);
      return;
    }

    // Production: xây dựng danh sách whitelist
    const prodList = process.env.FRONTEND_URL_PROD
      ? process.env.FRONTEND_URL_PROD.split(",").map((u) => u.trim())
      : [];

    const devList = process.env.FRONTEND_URL_DEV
      ? process.env.FRONTEND_URL_DEV.split(",").map((u) => u.trim())
      : [];

    // Kết hợp các nguồn: hardcoded + prod env + dev env
    // Giữ lại FRONTEND_URL cũ để tương thích ngược nếu cần
    let allowedOrigins = [
      "https://ezhome.website",
      "https://www.ezhome.website",
      ...prodList,
      ...devList,
    ];

    // Nếu có FRONTEND_URL (cũ) trong env, thêm vào luôn thay vì override hoàn toàn
    if (process.env.FRONTEND_URL && typeof process.env.FRONTEND_URL === 'string') {
      const legacyUrls = process.env.FRONTEND_URL.split(",").map((url) => url.trim());
      allowedOrigins = [...allowedOrigins, ...legacyUrls];
    }

    // Lọc bỏ các giá trị rỗng/undefined và duplicate
    allowedOrigins = [...new Set(allowedOrigins.filter(Boolean))];

    if (!origin) {
      // Same-origin request (không có origin header)
      callback(null, true);
    } else if (allowedOrigins.includes(origin)) {
      console.log("CORS: Allowing origin (production):", origin);
      callback(null, true);
    } else {
      console.warn("CORS: Blocking origin:", origin);
      console.warn("Allowed origins:", allowedOrigins);
      callback(new Error("Not allowed by CORS"));
    }
  },
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

swaggerSetup(app);

connectDB();

// Simple health check endpoint (không bị AdBlock chặn)
app.get("/health", (req, res) => {
  const mongoose = require("mongoose");
  const dbStatus = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const dbStatusText = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
  };

  res.json({
    status: "ok",
    message: "Server is running",
    database: dbStatusText[dbStatus] || "unknown",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development"
  });
});

// Debug endpoint to check environment setup (only in development)
app.get("/api/debug/env", (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ message: "Not available in production" });
  }

  res.json({
    env: process.env.NODE_ENV || "development",
    hasJwtAccessSecret: !!process.env.JWT_ACCESS_SECRET,
    hasJwtRefreshSecret: !!process.env.JWT_REFRESH_SECRET,
    hasMongoUri: !!process.env.MONGODB_URI,
    mongoUri: process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@') : 'not set',
    port: process.env.PORT || 5000,
    frontendUrl: process.env.FRONTEND_URL || "not set",
  });
});

app.use("/api", indexRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", protectedRoutes);
app.use("/api/test", testRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/home", homeRoutes);
// server-side proxy for provinces/districts to avoid CORS issues from browser
app.use("/api/locations", locationRoutes);

app.use(errorHandler);
app.enable('trust proxy');
app.listen(port, () => console.log(`Server running on port ${port}`));
