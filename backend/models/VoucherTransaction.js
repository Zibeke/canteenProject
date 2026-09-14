// File: backend/models/VoucherTransaction.js

const mongoose = require("mongoose");

const voucherTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    voucherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Voucher",
      required: true,
      index: true
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
      index: true
    },

    referenceNumber: {
      type: String,
      default: "",
      trim: true
    },

    type: {
      type: String,
      enum: [
        "monthly_credit",
        "order_debit",
        "refund_credit",
        "penalty_debit",
        "manual_adjustment"
      ],
      required: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    balanceBefore: {
      type: Number,
      required: true,
      min: 0,
      max: 500
    },

    balanceAfter: {
      type: Number,
      required: true,
      min: 0,
      max: 500
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500
    }
  },
  {
    timestamps: true,
    strict: true
  }
);

voucherTransactionSchema.index({
  userId: 1,
  createdAt: -1
});

module.exports = mongoose.model(
  "VoucherTransaction",
  voucherTransactionSchema
);
