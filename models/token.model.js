const mongoose = require("mongoose");

const refreshExpireDays = parseInt(process.env.JWT_REFRESH_EXPIRE_DAYS) || 7;

const tokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: refreshExpireDays * 24 * 60 * 60, // TTL in seconds
  },
});

const Token = mongoose.model("Token", tokenSchema);

module.exports = Token;


