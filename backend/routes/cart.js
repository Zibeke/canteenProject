const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getCart,
  addToCart,
  updateCart,
  removeFromCart,
  mergeCart,
  clearCart,
} = require("../controllers/cartController");

router.get("/", auth, getCart);
router.post("/add", auth, addToCart);
router.put("/update", auth, updateCart);
router.delete("/remove/:productId", auth, removeFromCart);
router.post("/merge", auth, mergeCart);
router.delete("/clear", auth, clearCart);

module.exports = router;
