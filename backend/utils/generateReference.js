const crypto = require("crypto");

const generateReference = () => {
  const today = new Date();
  const dateStr = today
    .toISOString()
    .split("T")[0]
    .replace(/-/g, "");
  const randomNum = crypto.randomInt(1000, 9999);
  return `CCI-${dateStr}-${randomNum}`;
};

module.exports = generateReference;
