// File: backend/models/Order.js

const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    qty: {
      type: Number,
      required: true,
      min: 1
    },

    image: {
      type: String,
      default: ""
    }
  },
  {
    _id: false,
    strict: true
  }
);

const paymentBreakdownSchema = new mongoose.Schema(
  {
    voucherAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    cashAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    cardAmount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    _id: false,
    strict: true
  }
);

const trackingHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "ready_for_collection",
        "collected",
        "cancelled"
      ],
      required: true
    },

    date: {
      type: Date,
      default: Date.now
    },

    note: {
      type: String,
      default: ""
    }
  },
  {
    _id: false,
    strict: true
  }
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    referenceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "Order must contain at least one item."
      }
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },

    paymentBreakdown: {
      type: paymentBreakdownSchema,
      required: true
    },

    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "partial",
        "paid",
        "failed",
        "refunded",
        "partial_refund"
      ],
      default: "pending",
      index: true
    },

    orderStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "ready_for_collection",
        "collected",
        "cancelled"
      ],
      default: "pending",
      index: true
    },

    stripePaymentIntentId: {
      type: String,
      default: null,
      index: true
    },

    cashPaymentStatus: {
      type: String,
      enum: [
        "not_required",
        "pending_at_till",
        "paid_at_till"
      ],
      default: "not_required"
    },

    confirmationEmailSentAt: {
      type: Date,
      default: null
    },

    penaltyAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    trackingHistory: {
      type: [trackingHistorySchema],
      default: []
    },

    readyAt: {
      type: Date,
      default: null
    },

    cancellationReason: {
      type: String,
      default: ""
    },

    collectedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    strict: true
  }
);

orderSchema.index({
  userId: 1,
  createdAt: -1
});

orderSchema.index({
  orderStatus: 1,
  createdAt: -1
});

module.exports = mongoose.model("Order", orderSchema);
