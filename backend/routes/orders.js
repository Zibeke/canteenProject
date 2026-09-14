const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { trackingLimiter } = require("../middleware/rateLimiter");
const {
  createOrder,
  getMyOrders,
  trackOrder,
  updateOrderStatus,
  cancelOrder,
} = require("../controllers/orderController");
const isAdmin = require("../middleware/isAdmin");

router.post("/", auth, createOrder);
router.get("/my-orders", auth, getMyOrders);
router.get("/track/:referenceNumber", trackingLimiter, trackOrder);
router.put("/:id/status", auth, isAdmin, updateOrderStatus);
router.post("/:id/cancel", auth, cancelOrder);

module.exports = router;
