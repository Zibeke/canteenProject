// File: backend/middleware/rateLimiter.js

const rateLimit = require("express-rate-limit");

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: (req) => req.method !== "POST",
  message: "Too many auth attempts, please try again later.",
});

const loginLimiterOptions = {
  windowMs: 15 * 60 * 1000,
  max: 5,
  skip: (req) => req.method !== "POST",
  message: "Too many login attempts, please try again later.",
};

if (process.env.REDIS_URL) {
  const { RedisStore } = require("rate-limit-redis");
  const { createClient } = require("redis");
  const redisClient = createClient({ url: process.env.REDIS_URL });

  redisClient.on("error", (error) => {
    console.error("Redis rate-limit store error:", error);
  });

  redisClient.connect().catch((error) => {
    console.error("Redis rate-limit store connection error:", error);
  });

  loginLimiterOptions.store = new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: "login-limiter:",
  });
}

const loginLimiter = rateLimit(loginLimiterOptions);

const trackingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: "Too many tracking requests, please try again later.",
});

module.exports = {
  globalLimiter,
  authLimiter,
  loginLimiter,
  trackingLimiter,
};
