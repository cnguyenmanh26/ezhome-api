const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

// Đảm bảo dotenv đã được load
if (!process.env.GOOGLE_CLIENT_ID) {
  try {
    require("dotenv").config();
  } catch (e) {
    // dotenv đã được config ở nơi khác
  }
}

const hasGoogleConfig =
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CALLBACK_URL;

if (hasGoogleConfig) {
  // Log để debug
  console.log("✅ Google OAuth configured:");
  console.log("   Client ID:", process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + "...");
  console.log("   Callback URL:", process.env.GOOGLE_CALLBACK_URL);

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const { id: googleId, displayName: name, photos, emails } = profile;
          const email = emails && emails[0] ? emails[0].value : null;
          const avatar = photos && photos[0] ? photos[0].value : null;

          if (!email) {
            return done(
              new Error("Google account does not have an email"),
              null
            );
          }

          let user = await User.findOne({ googleId });

          if (user) {
            // Cập nhật name nếu user chưa có name
            if (!user.name || user.name.trim() === "") {
              user.name = name;
              await user.save();
            }
            // Không cập nhật avatar vì user có thể đã tự upload avatar riêng
            return done(null, user);
          }

          user = await User.findOne({ email });

          if (user) {
            user.googleId = googleId;
            // Chỉ set avatar từ Google nếu user chưa có avatar
            if (avatar && !user.avatar) {
              user.avatar = avatar;
            }
            // Cập nhật name nếu user chưa có name
            if (!user.name || user.name.trim() === "") {
              user.name = name;
            }
            await user.save();
            return done(null, user);
          }

          user = await User.create({
            googleId,
            email,
            name,
            avatar,
          });

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
} else {
  console.warn(
    "⚠️  Google OAuth credentials not found. Google login will be disabled."
  );
  console.warn(
    "   Missing:",
    !process.env.GOOGLE_CLIENT_ID ? "GOOGLE_CLIENT_ID" : "",
    !process.env.GOOGLE_CLIENT_SECRET ? "GOOGLE_CLIENT_SECRET" : "",
    !process.env.GOOGLE_CALLBACK_URL ? "GOOGLE_CALLBACK_URL" : ""
  );
}

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;

