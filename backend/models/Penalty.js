// File: backend/models/Penalty.js

const mongoose = require("mongoose");

const penaltySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true
    },

    referenceNumber: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    status: {
      type: String,
      enum: [
        "pending_payment",
        "paid_at_till",
        "deducted_from_voucher",
        "waived"
      ],
      default: "pending_payment",
      index: true
    },

    dueAt: {
      type: Date,
      required: true,
      index: true
    },

    reason: {
      type: String,
      enum: [
        "cancellation_after_processing",
        "canteen_closed"
      ],
      required: true
    },

    reminder8hSentAt: {
      type: Date,
      default: null
    },

    reminder20hSentAt: {
      type: Date,
      default: null
    },

    immediateEmailSentAt: {
      type: Date,
      default: null
    },

    paidAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    strict: true
  }
);

module.exports = mongoose.model("Penalty", penaltySchema);
