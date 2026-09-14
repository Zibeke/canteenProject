// File: backend/models/CanteenConfig.js

const mongoose = require("mongoose");

const canteenConfigSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
      unique: true,
      index: true,
      match: /^\d{4}-\d{2}-\d{2}$/
    },

    closingTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/
    },

    lastUpdatedBy: {
      type: String,
      default: ""
    },

    isAutoCloseEnabled: {
      type: Boolean,
      default: true
    },

    manuallyUpdated: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    strict: true
  }
);

module.exports = mongoose.model(
  "CanteenConfig",
  canteenConfigSchema
);
