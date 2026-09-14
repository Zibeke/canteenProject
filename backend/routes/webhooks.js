const express = require("express");
const router = express.Router();
const stripe = require("stripe")(require("../config/config").stripe.secretKey);
const Order = require("../models/Order");
const config = require("../config/config");
const { sendOrderConfirmationEmail } = require("../utils/nodemailer");

router.post("/stripe", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      config.stripe.webhookSecret
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        const order = await Order.findOne({
          $or: [
            { stripePaymentIntentId: paymentIntent.id },
            { _id: paymentIntent.metadata?.orderId },
          ],
        }).populate("userId");

        if (order) {
          const expectedAmount = Math.round(
            order.paymentBreakdown.cardAmount * 100
          );
          if (
            paymentIntent.metadata?.orderId !== order._id.toString() ||
            paymentIntent.amount !== expectedAmount ||
            paymentIntent.currency !== "zar"
          ) {
            console.error("Ignoring Stripe payment for mismatched order:", paymentIntent.id);
            break;
          }

          const wasAlreadyPaid = order.paymentStatus === "paid";
          order.stripePaymentIntentId = paymentIntent.id;
          order.paymentStatus = "paid";
          order.orderStatus = "confirmed";

          if (!wasAlreadyPaid) {
            order.trackingHistory.push({
              status: "confirmed",
              date: new Date(),
              note: "Payment received via Stripe",
            });
          }

          await order.save();

          if (!wasAlreadyPaid || !order.confirmationEmailSentAt) {
            try {
              await sendOrderConfirmationEmail(
                order.userId,
                order,
                order.referenceNumber
              );
              order.confirmationEmailSentAt = new Date();
              await order.save();
            } catch (emailError) {
              console.error("Error sending confirmation email:", emailError);
            }
          }
        }
        break;

      case "payment_intent.payment_failed":
        const failedIntent = event.data.object;
        const failedOrder = await Order.findOne({
          stripePaymentIntentId: failedIntent.id,
        });

        if (failedOrder) {
          failedOrder.paymentStatus = "pending";
          await failedOrder.save();
        }
        break;

      case "checkout.session.completed": {
        const session = event.data.object;
        const order = await Order.findById(session.metadata?.orderId).populate("userId");

        if (
          order &&
          (!order.confirmationEmailSentAt || order.paymentStatus !== "paid") &&
          session.payment_status === "paid" &&
          session.amount_total ===
            Math.round(order.paymentBreakdown.cardAmount * 100)
        ) {
          if (session.currency !== "zar") {
            break;
          }

          if (session.payment_intent) {
            order.stripePaymentIntentId = session.payment_intent;
          }
          order.paymentStatus = "paid";
          order.orderStatus = "confirmed";
          order.trackingHistory.push({
            status: "confirmed",
            date: new Date(),
            note: "Payment received via Stripe Checkout",
          });
          await order.save();

          try {
            await sendOrderConfirmationEmail(
              order.userId,
              order,
              order.referenceNumber
            );
            order.confirmationEmailSentAt = new Date();
            await order.save();
          } catch (emailError) {
            console.error("Error sending confirmation email:", emailError);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

module.exports = router;
