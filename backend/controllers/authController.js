const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const User = require("../models/User");

const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  });
};

const generateRefreshToken = (userId, version) => {
  return jwt.sign({ userId, version }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
};

const hashRefreshToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const issueTokens = async (user, res) => {
  user.refreshTokenVersion += 1;
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(
    user._id,
    user.refreshTokenVersion
  );
  user.refreshTokenHash = hashRefreshToken(refreshToken);
  await user.save();
  setTokenCookies(res, accessToken, refreshToken);
};

const setTokenCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? "none" : "lax",
    maxAge: 15 * 60 * 1000,
    signed: false,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    signed: false,
  });
};

const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (
      username !== config.adminUsername ||
      password !== config.adminPassword
    ) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    if (!config.adminEmail) {
      console.error("Admin login is unavailable: ADMIN_EMAIL is not configured");
      return res.status(503).json({ error: "Admin authentication unavailable" });
    }

    const user = await User.findOne({
      email: config.adminEmail.toLowerCase(),
      role: "admin",
    });

    if (!user) {
      console.error(
        "Admin login is unavailable: configured admin account does not exist with role admin"
      );
      return res.status(503).json({ error: "Admin authentication unavailable" });
    }

    user.lastLoginAt = new Date();
    await issueTokens(user, res);
    res.json({ success: true });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ error: "Unable to log in as admin" });
  }
};

const googleCallback = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.redirect(`${config.clientUrl}/login?error=auth_failed`);
    }

    await issueTokens(user, res);

    const redirectPath = req.session.redirectUrl || "/";
    delete req.session.redirectUrl;

    res.redirect(new URL(redirectPath, config.clientUrl).toString());
  } catch (error) {
    console.error("Google callback error:", error);
    res.redirect(`${config.clientUrl}/login?error=server_error`);
  }
};

const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token not found" });
    }

    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    const user = await User.findById(decoded.userId).select("+refreshTokenHash");

    if (
      !user ||
      decoded.version !== user.refreshTokenVersion ||
      user.refreshTokenHash !== hashRefreshToken(refreshToken)
    ) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    await issueTokens(user, res);
    res.json({ success: true });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(401).json({ error: "Invalid refresh token" });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-refreshTokenHash");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { refreshTokenVersion: 1 },
      $unset: { refreshTokenHash: 1 },
    });
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  adminLogin,
  googleCallback,
  refreshAccessToken,
  getCurrentUser,
  logout,
};