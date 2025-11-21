const jwt = require("jsonwebtoken");

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
        { userId: user._id, email: user.email, role: user.role },
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

module.exports = {
    getFrontendUrl,
    generateAccessToken,
    generateRefreshToken,
};
