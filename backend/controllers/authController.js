// File: backend/controllers/authController.js

const jwt = require("jsonwebtoken");
const config = require("../config/config");
const User = require("../models/User");
const Voucher = require("../models/Voucher");

const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
};

const setTokenCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: "lax",
    maxAge: 15 * 60 * 1000,
    signed: false,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: "lax",
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

    const adminEmail = config.adminEmail || "admin@gmail.com";
    let user = await User.findOne({
      $or: [{ email: adminEmail }, { googleId: "local-admin" }],
    });

    if (!user) {
      user = await User.create({
        googleId: "local-admin",
        email: adminEmail,
        name: "admin",
        role: "admin",
        voucherBalance: 0,
        monthlyVoucherCap: 500,
        lastLoginAt: new Date(),
      });
    } else {
      user.role = "admin";
      user.lastLoginAt = new Date();
      await user.save();
    }

    setTokenCookies(
      res,
      generateAccessToken(user._id),
      generateRefreshToken(user._id)
    );

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

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    setTokenCookies(res, accessToken, refreshToken);

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
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    setTokenCookies(res, newAccessToken, newRefreshToken);

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
