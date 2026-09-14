// File: backend/models/Voucher.js

const mongoose = require("mongoose");

const voucherSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    code: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
      max: 500
    },

    remainingAmount: {
      type: Number,
      required: true,
      min: 0,
      max: 500
    },

    originalAmount: {
      type: Number,
      required: true,
      min: 0,
      max: 500
    },

    month: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}$/,
      index: true
    },

    isUsed: {
      type: Boolean,
      default: false
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true
    }
  },
  {
    timestamps: true,
    strict: true
  }
);

voucherSchema.index(
  {
    userId: 1,
    month: 1
  },
  {
    unique: true
  }
);

module.exports = mongoose.model("Voucher", voucherSchema);