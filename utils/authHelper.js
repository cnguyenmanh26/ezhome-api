const jwt = require("jsonwebtoken");

// Helper function to get frontend URL - works for all environments
const getFrontendUrl = (req) => {
    // Lấy danh sách các URL được phép từ env
    const prodUrls = process.env.FRONTEND_URL_PROD
        ? process.env.FRONTEND_URL_PROD.split(",").map(u => u.trim())
        : [];
    const devUrls = process.env.FRONTEND_URL_DEV
        ? process.env.FRONTEND_URL_DEV.split(",").map(u => u.trim())
        : [];
    const allowedUrls = [...prodUrls, ...devUrls, process.env.FRONTEND_URL].filter(Boolean);

    // Helper để tìm URL khớp trong danh sách allowed
    const findMatchingUrl = (urlToCheck) => {
        if (!urlToCheck) return null;
        try {
            const originObj = new URL(urlToCheck);
            const originStr = `${originObj.protocol}//${originObj.host}`;
            return allowedUrls.find(allowed => {
                try {
                    const allowedObj = new URL(allowed);
                    return allowedObj.origin === originStr;
                } catch { return false; }
            });
        } catch { return null; }
    };

    // 1. Ưu tiên: Detect từ origin header (thường có trong request API)
    const origin = req.get("origin");
    const matchedOrigin = findMatchingUrl(origin);
    if (matchedOrigin) {
        console.log("Using matched origin:", matchedOrigin);
        return matchedOrigin;
    }

    // 2. Fallback: Detect từ referer header (Google redirect thường có referer)
    const referer = req.get("referer");
    const matchedReferer = findMatchingUrl(referer);
    if (matchedReferer) {
        console.log("Using matched referer:", matchedReferer);
        return matchedReferer;
    }

    // 3. Nếu không detect được hoặc không khớp whitelist, dùng default cố định
    if (process.env.FRONTEND_URL) {
        console.log("Using default FRONTEND_URL:", process.env.FRONTEND_URL);
        return process.env.FRONTEND_URL;
    }

    // 4. Last fallback
    return process.env.NODE_ENV === "production"
        ? "https://ezhome.website"
        : "http://localhost:3000";
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
