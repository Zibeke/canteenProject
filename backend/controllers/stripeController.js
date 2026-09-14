// File: backend/controllers/stripeController.js

const stripe = require("stripe")(require("../config/config").stripe.secretKey);
const Order = require("../models/Order");
const User = require("../models/User");
const config = require("../config/config");
const { sendOrderConfirmationEmail } = require("../utils/nodemailer");

const createPaymentIntent = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "Invalid order or amount" });
    }

    const order = await Order.findById(orderId).populate("userId");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    if (order.paymentStatus !== "pending" || order.paymentBreakdown.cardAmount <= 0) {
      return res.status(400).json({ error: "Order is not awaiting card payment" });
    }

    const amount = order.paymentBreakdown.cardAmount;

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "zar",
      metadata: {
        orderId: orderId,
        referenceNumber: order.referenceNumber,
        userId: order.userId._id.toString(),
      },
      description: `Order ${order.referenceNumber} from CCI Canteen`,
    });

    // Save Stripe payment intent ID to order
    order.stripePaymentIntentId = paymentIntent.id;
    await order.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Create payment intent error:", error);
    res.status(500).json({ error: "Failed to create payment intent" });
  }
};

const confirmPaymentIntent = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: "Payment intent ID required" });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      const order = await Order.findOne({
        stripePaymentIntentId: paymentIntentId,
        userId: req.user._id,
      }).populate("userId");

      if (order) {
        const expectedAmount = Math.round(order.paymentBreakdown.cardAmount * 100);
        if (
          paymentIntent.metadata?.orderId !== order._id.toString() ||
          paymentIntent.metadata?.userId !== req.user._id.toString() ||
          paymentIntent.amount !== expectedAmount ||
          paymentIntent.currency !== "zar"
        ) {
          return res.status(400).json({ error: "Payment intent does not match order" });
        }

        const wasAlreadyPaid = order.paymentStatus === "paid";
        order.paymentStatus = "paid";
        order.orderStatus = "confirmed";
        if (!wasAlreadyPaid) {
          order.trackingHistory.push({
            status: "confirmed",
            date: new Date(),
            note: "Payment confirmed via Stripe",
          });
        }

        await order.save();

        if (!wasAlreadyPaid) {
          try {
            await sendOrderConfirmationEmail(
              order.userId,
              order,
              order.referenceNumber
            );
          } catch (emailError) {
            console.error("Error sending confirmation email:", emailError);
          }
        }

        return res.json({
          success: true,
          order,
          message: "Payment confirmed successfully",
        });
      }
    }

    res.json({
      success: false,
      status: paymentIntent.status,
      message: `Payment status: ${paymentIntent.status}`,
    });
  } catch (error) {
    console.error("Confirm payment error:", error);
    res.status(500).json({ error: "Failed to confirm payment" });
  }
};

const getPaymentStatus = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    if (!paymentIntentId) {
      return res.status(400).json({ error: "Payment intent ID required" });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      created: new Date(paymentIntent.created * 1000),
    });
  } catch (error) {
    console.error("Get payment status error:", error);
    res.status(500).json({ error: "Failed to get payment status" });
  }
};

module.exports = {
  createPaymentIntent,
  confirmPaymentIntent,
  getPaymentStatus,
};
