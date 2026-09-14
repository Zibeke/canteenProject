const express = require("express");
const passport = require("passport");
const router = express.Router();
const config = require("../config/config");
const {
  googleCallback,
  adminLogin,
  refreshAccessToken,
  getCurrentUser,
  logout,
} = require("../controllers/authController");
const auth = require("../middleware/auth");
const { loginLimiter } = require("../middleware/rateLimiter");

router.get(
  "/google",
  (req, res, next) => {
    const redirectUrl = req.query.redirect;
    if (
      typeof redirectUrl === "string" &&
      redirectUrl.startsWith("/") &&
      !redirectUrl.startsWith("//")
    ) {
      req.session.redirectUrl = redirectUrl;
    }
    next();
  },
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  (req, res, next) => {
    passport.authenticate("google", (error, user) => {
      if (error) {
        console.error("Google authentication failed:", error.message);
        return res.redirect(`${config.clientUrl}/login?error=auth_unavailable`);
      }

      if (!user) {
        return res.redirect(`${config.clientUrl}/login?error=auth_failed`);
      }

      req.logIn(user, (loginError) => {
        if (loginError) {
          return next(loginError);
        }
        next();
      });
    })(req, res, next);
  },
  googleCallback
);

router.post("/admin-login", loginLimiter, adminLogin);
router.post("/refresh", refreshAccessToken);

router.get("/me", auth, getCurrentUser);

router.post("/logout", auth, logout);

module.exports = router;
