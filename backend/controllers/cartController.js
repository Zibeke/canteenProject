// File: backend/controllers/cartController.js

const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { validateAddToCart, validateUpdateCart } = require("../utils/validators");

const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id }).populate(
      "items.productId"
    );

    if (!cart) {
      return res.json({ items: [] });
    }

    res.json(cart);
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
};

const addToCart = async (req, res) => {
  try {
    const { error, value } = validateAddToCart(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const product = await Product.findById(value.productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (!product.isAvailableToday) {
      return res.status(400).json({ error: "Product not available today" });
    }

    let cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      cart = new Cart({ userId: req.user._id, items: [] });
    }

    const existingItem = cart.items.find(
      (item) => item.productId.toString() === value.productId
    );

    if (existingItem) {
      existingItem.qty += value.qty;
    } else {
      cart.items.push({
        productId: value.productId,
        qty: value.qty,
        priceAtAdd: product.isSpecial && product.specialPrice ? product.specialPrice : product.price,
      });
    }

    await cart.save();
    await cart.populate("items.productId");

    res.json(cart);
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ error: "Failed to add to cart" });
  }
};

const updateCart = async (req, res) => {
  try {
    const { error, value } = validateUpdateCart(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    let cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      cart = new Cart({ userId: req.user._id, items: [] });
    }

    for (const item of value.items) {
      const product = await Product.findById(item.productId);

      if (!product || !product.isAvailableToday) {
        continue;
      }

      const existingItem = cart.items.find(
        (ci) => ci.productId.toString() === item.productId
      );

      if (existingItem) {
        existingItem.qty = item.qty;
      } else {
        cart.items.push({
          productId: item.productId,
          qty: item.qty,
          priceAtAdd: product.isSpecial && product.specialPrice ? product.specialPrice : product.price,
        });
      }
    }

    await cart.save();
    await cart.populate("items.productId");

    res.json(cart);
  } catch (error) {
    console.error("Update cart error:", error);
    res.status(500).json({ error: "Failed to update cart" });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId
    );

    await cart.save();
    await cart.populate("items.productId");

    res.json(cart);
  } catch (error) {
    console.error("Remove from cart error:", error);
    res.status(500).json({ error: "Failed to remove from cart" });
  }
};

const mergeCart = async (req, res) => {
  try {
    const { guestItems } = req.body;

    if (!Array.isArray(guestItems)) {
      return res.status(400).json({ error: "Guest items must be an array" });
    }

    let cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      cart = new Cart({ userId: req.user._id, items: [] });
    }

    for (const item of guestItems) {
      const product = await Product.findById(item.productId);

      if (!product || !product.isAvailableToday) {
        continue;
      }

      const existingItem = cart.items.find(
        (ci) => ci.productId.toString() === item.productId
      );

      if (existingItem) {
        existingItem.qty += item.qty;
      } else {
        cart.items.push({
          productId: item.productId,
          qty: item.qty,
          priceAtAdd: product.isSpecial && product.specialPrice ? product.specialPrice : product.price,
        });
      }
    }

    await cart.save();
    await cart.populate("items.productId");

    res.json(cart);
  } catch (error) {
    console.error("Merge cart error:", error);
    res.status(500).json({ error: "Failed to merge cart" });
  }
};

const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate(
      { userId: req.user._id },
      { items: [] },
      { new: true }
    );

    res.json({ items: [] });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({ error: "Failed to clear cart" });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCart,
  removeFromCart,
  mergeCart,
  clearCart,
};
