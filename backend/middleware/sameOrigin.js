const config = require("../config/config");

const sameOrigin = (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const origin = req.get("origin");
  if (origin && origin !== config.clientUrl) {
    return res.status(403).json({ error: "Request origin is not allowed" });
  }

  next();
};

module.exports = sameOrigin;
