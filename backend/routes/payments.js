const express = require("express");
const stripe = require("stripe")(require("../config/config").stripe.secretKey);
const auth = require("../middleware/auth");
const Order = require("../models/Order");
const config = require("../config/config");

const router = express.Router();

router.post("/checkout-session", auth, async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findOne({
      _id: orderId,
      userId: req.user._id,
      paymentStatus: "pending",
    }).populate("userId", "email");

    if (!order || order.paymentBreakdown.cardAmount <= 0) {
      return res.status(400).json({ error: "Invalid card payment order" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: order.userId.email,
      line_items: [
        {
          price_data: {
            currency: "zar",
            product_data: { name: `Canteen order ${order.referenceNumber}` },
            unit_amount: Math.round(order.paymentBreakdown.cardAmount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: { orderId: order._id.toString() },
      payment_intent_data: {
        metadata: {
          orderId: order._id.toString(),
          referenceNumber: order.referenceNumber,
          userId: req.user._id.toString(),
        },
      },
      success_url: `${config.clientUrl}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.clientUrl}/cart`,
    });

    order.stripePaymentIntentId = session.payment_intent || null;
    await order.save();
    res.json({ url: session.url });
  } catch (error) {
    console.error("Create Stripe checkout session error:", error);
    res.status(500).json({ error: "Unable to start card payment" });
  }
});

module.exports = router;
