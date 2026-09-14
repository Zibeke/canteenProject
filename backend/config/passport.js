// File: backend/config/passport.js

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const config = require("./config");
const User = require("../models/User");

passport.use(
  new GoogleStrategy(
    {
      clientID: config.google.clientId,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackUrl,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value.toLowerCase();

        if (!email.endsWith("@gmail.com")) {
          return done(null, false, {
            message: "Only Gmail accounts are allowed during testing.",
          });
        }

        let user = await User.findOne({
          $or: [{ googleId: profile.id }, { email }],
        });

        if (user) {
          user.googleId = profile.id;
          user.role = email === config.adminEmail?.toLowerCase() ? "admin" : user.role;
          user.lastLoginAt = new Date();
          await user.save();
          return done(null, user);
        }

        // Create new user
        user = new User({
          googleId: profile.id,
          email: email,
          name: profile.displayName || "User",
          picture: profile.photos[0]?.value || "",
          role: email === config.adminEmail ? "admin" : "user",
          voucherBalance: 0,
          monthlyVoucherCap: 500,
          lastLoginAt: new Date(),
        });

        await user.save();
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
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
