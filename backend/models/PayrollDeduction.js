// File: backend/models/PayrollDeduction.js

const mongoose = require("mongoose");

const payrollDeductionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    month: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}$/,
      index: true,
    },
    totalVoucherUsed: {
      type: Number,
      required: true,
      min: 0,
    },
    extraOwed: {
      type: Number,
      required: true,
      min: 0,
    },
    totalToDeduct: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "processed", "paid"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true, strict: true }
);

payrollDeductionSchema.index({ userId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model("PayrollDeduction", payrollDeductionSchema);
