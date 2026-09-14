// File: backend/models/User.js

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },

    picture: {
      type: String,
      default: "",
      trim: true
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true
    },

    employeeId: {
      type: String,
      default: "",
      trim: true,
      maxlength: 50
    },

    voucherBalance: {
      type: Number,
      min: 0,
      max: 500,
      default: 0
    },

    monthlyVoucherCap: {
      type: Number,
      min: 0,
      max: 500,
      default: 500
    },

    lastVoucherMonth: {
      type: String,
      default: ""
    },

    voucherExpiresAt: {
      type: Date,
      default: null
    },

    refreshTokenHash: {
      type: String,
      default: null,
      select: false
    },

    refreshTokenVersion: {
      type: Number,
      default: 0
    },

    lastLoginAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    strict: true
  }
);

userSchema.pre("validate", function (next) {
  if (this.voucherBalance < 0 || !Number.isFinite(this.voucherBalance)) {
    this.voucherBalance = 0;
  }
  next();
});

userSchema.index({
  email: 1
});

module.exports = mongoose.model("User", userSchema);
