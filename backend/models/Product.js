// File: backend/models/Product.js

const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },

    images: [
      {
        type: String,
        trim: true
      }
    ],

    category: {
      type: String,
      enum: [
        "Hot Food",
        "Cold Drinks",
        "Snacks",
        "Breakfast"
      ],
      required: true,
      index: true
    },

    isSpecial: {
      type: Boolean,
      default: false,
      index: true
    },

    specialPrice: {
      type: Number,
      min: 0,
      default: null
    },

    isAvailableToday: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    strict: true
  }
);

productSchema.index({
  name: "text",
  description: "text"
});

module.exports = mongoose.model("Product", productSchema);
