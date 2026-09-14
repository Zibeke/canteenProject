// File: backend/config/db.js

const mongoose = require("mongoose");
const config = require("./config");

async function connectDatabase() {
  if (!config.mongoUri) {
    throw new Error("DB_URI is not configured.");
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(config.mongoUri, {
    autoIndex: config.nodeEnv !== "production"
  });

  console.log("MongoDB connection established.");
}

module.exports = connectDatabase;
