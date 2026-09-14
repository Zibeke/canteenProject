// File: backend/middleware/auth.js

const jwt = require("jsonwebtoken");
const config = require("../config/config");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      return res.status(401).json({ error: "Access denied. Not authenticated." });
    }

    const decoded = jwt.verify(accessToken, config.jwt.accessSecret);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: "User not found." });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = auth;
