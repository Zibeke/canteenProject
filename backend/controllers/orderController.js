// File: backend/controllers/orderController.js

const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const User = require("../models/User");
const Voucher = require("../models/Voucher");
const Penalty = require("../models/Penalty");
const { validateCheckout } = require("../utils/validators");
const generateReference = require("../utils/generateReference");
const mongoose = require("mongoose");
const stripe = require("stripe")(require("../config/config").stripe.secretKey);
const {
  sendOrderConfirmationEmail,
  sendCashOrderConfirmationEmail,
  sendOrderReadyEmail,
  sendOrderCancelledEmail,
  sendPenaltyEmail,
} = require("../utils/nodemailer");

const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { error, value } = validateCheckout(req.body);

    if (error) {
      await session.abortTransaction();
      return res.status(400).json({ error: error.details[0].message });
    }

    const user = await User.findById(req.user._id).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ error: "User not found" });
    }

    let items = [];
    let totalAmount = 0;

    for (const item of value.items) {
      const product = await Product.findById(item.productId).session(session);

      if (!product || !product.isAvailableToday) {
        await session.abortTransaction();
        return res
          .status(400)
          .json({ error: `Product ${item.productId} not available` });
      }

      if (product.stock < item.qty) {
        await session.abortTransaction();
        return res
          .status(400)
          .json({ error: `Insufficient stock for ${product.name}` });
      }

      const price =
        product.isSpecial && product.specialPrice
          ? product.specialPrice
          : product.price;

      items.push({
        productId: product._id,
        name: product.name,
        price,
        qty: item.qty,
        image: product.images[0] || "",
      });

      totalAmount += price * item.qty;

      await Product.findByIdAndUpdate(
        product._id,
        { $inc: { stock: -item.qty } },
        { session }
      );
    }

    let voucherAmount = 0;
    let paymentStatus = "pending";

    if (value.paymentMethod === "pay_by_voucher") {
      const voucherBalance =
        user.voucherExpiresAt && user.voucherExpiresAt <= new Date()
          ? 0
          : Math.max(0, Number(user.voucherBalance || 0));

      if (voucherBalance < totalAmount) {
        await session.abortTransaction();
        return res.status(400).json({
          error: "Insufficient voucher balance for this order",
        });
      }

      voucherAmount = totalAmount;
      totalAmount = 0;

      if (voucherAmount > 0) {
        const updatedUser = await User.findOneAndUpdate(
          {
            _id: user._id,
            voucherBalance: { $gte: voucherAmount },
          },
          { $inc: { voucherBalance: -voucherAmount } },
          { new: true, session }
        );

        if (!updatedUser) {
          await session.abortTransaction();
          return res.status(409).json({
            error: "Voucher balance changed. Please try again.",
          });
        }
      }

      if (totalAmount > 0) {
        paymentStatus = "partial";
      } else {
        paymentStatus = "paid";
      }
    } else if (value.paymentMethod === "pay_by_card") {
      paymentStatus = "pending";
    } else if (value.paymentMethod === "cash_at_till") {
      paymentStatus = "pending";
    }

    const referenceNumber = generateReference();
    const orderNumber = `ORD-${Date.now()}`;

    const order = new Order({
      userId: user._id,
      orderNumber,
      referenceNumber,
      items,
      totalAmount,
      paymentBreakdown: {
        voucherAmount,
        cashAmount: value.paymentMethod === "cash_at_till" ? totalAmount : 0,
        cardAmount: value.paymentMethod === "pay_by_card" ? totalAmount : 0,
      },
      paymentStatus,
      orderStatus: "pending",
      cashPaymentStatus:
        value.paymentMethod === "cash_at_till" ? "pending_at_till" : "not_required",
    });

    await order.save({ session });

    if (value.paymentMethod === "pay_by_voucher") {
      order.trackingHistory.push({
        status: "confirmed",
        date: new Date(),
        note: `Paid with voucher R${voucherAmount}`,
      });
      order.orderStatus = "confirmed";
      order.paymentStatus = "paid";
      await order.save({ session });
    }

    await Cart.findOneAndUpdate(
      { userId: user._id },
      { items: [] },
      { session }
    );

    await session.commitTransaction();

    if (order.paymentStatus === "paid") {
      try {
        await sendOrderConfirmationEmail(user, order, referenceNumber);
        order.confirmationEmailSentAt = new Date();
        await order.save();
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
      }
    } else if (value.paymentMethod === "cash_at_till") {
      try {
        await sendCashOrderConfirmationEmail(user, order, referenceNumber);
        order.confirmationEmailSentAt = new Date();
        await order.save();
      } catch (emailError) {
        console.error("Error sending cash order email:", emailError);
      }
    }

    res.status(201).json(order);
  } catch (error) {
    await session.abortTransaction();
    console.error("Create order error:", error);
    res.status(500).json({ error: "Failed to create order" });
  } finally {
    session.endSession();
  }
};

const getMyOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = { userId: req.user._id };

    if (status) {
      query.orderStatus = status;
    }

    const orders = await Order.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get my orders error:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

const trackOrder = async (req, res) => {
  try {
    const { referenceNumber } = req.params;

    const order = await Order.findOne({ referenceNumber }).select(
      "referenceNumber orderStatus trackingHistory totalAmount paymentStatus createdAt readyAt"
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Track order error:", error);
    res.status(500).json({ error: "Failed to track order" });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    const validStatuses = [
      "pending",
      "confirmed",
      "processing",
      "ready_for_collection",
      "collected",
      "cancelled",
    ];

    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({ error: "Invalid order status" });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { orderStatus },
      { new: true }
    ).populate("userId");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    order.trackingHistory.push({
      status: orderStatus,
      date: new Date(),
    });

    if (orderStatus === "ready_for_collection") {
      order.readyAt = new Date();

      try {
        await sendOrderReadyEmail(order.userId, order.referenceNumber);
      } catch (emailError) {
        console.error("Error sending ready email:", emailError);
      }
    }

    await order.save();

    res.json(order);
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ error: "Failed to update order" });
  }
};

const cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;

    const order = await Order.findById(id).session(session).populate("userId");

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.userId._id.toString() !== req.user._id.toString()) {
      await session.abortTransaction();
      return res.status(403).json({ error: "Not authorized to cancel this order" });
    }

    if (["collected", "cancelled"].includes(order.orderStatus)) {
      await session.abortTransaction();
      return res.status(400).json({ error: "Cannot cancel this order" });
    }

    let refundAmount = 0;
    let penaltyAmount = 0;
    let voucherRefund = 0;

    const isEarlyCancellation = ["pending", "confirmed"].includes(order.orderStatus);
    const isLateCancellation = ["processing", "ready_for_collection"].includes(order.orderStatus);
    const paidAmount =
      order.paymentBreakdown.voucherAmount +
      order.paymentBreakdown.cardAmount;

    if (isEarlyCancellation) {
      refundAmount = paidAmount;
      if (order.paymentBreakdown.voucherAmount > 0) {
        await User.findByIdAndUpdate(
          order.userId._id,
          { $inc: { voucherBalance: order.paymentBreakdown.voucherAmount } },
          { session }
        );
      }
      if (order.stripePaymentIntentId && order.paymentBreakdown.cardAmount > 0) {
        await stripe.refunds.create({ payment_intent: order.stripePaymentIntentId });
      }
      order.paymentStatus = paidAmount > 0 ? "refunded" : order.paymentStatus;
    } else if (isLateCancellation) {
      const chargeableAmount = order.totalAmount + order.paymentBreakdown.voucherAmount;
      penaltyAmount = Math.round(chargeableAmount * 0.25 * 100) / 100;
      refundAmount = Math.round((chargeableAmount - penaltyAmount) * 100) / 100;

      if (order.paymentBreakdown.voucherAmount > 0) {
        voucherRefund = Math.min(
          order.paymentBreakdown.voucherAmount,
          refundAmount
        );
        await User.findByIdAndUpdate(
          order.userId._id,
          { $inc: { voucherBalance: voucherRefund } },
          { session }
        );
      }

      if (order.stripePaymentIntentId && order.paymentBreakdown.cardAmount > 0) {
        const cardRefund = Math.max(
          0,
          Math.min(
            order.paymentBreakdown.cardAmount,
            refundAmount - voucherRefund
          )
        );
        if (cardRefund > 0) {
          await stripe.refunds.create({
            payment_intent: order.stripePaymentIntentId,
            amount: Math.round(cardRefund * 100),
          });
        }
      }

      const cashOnly = order.paymentBreakdown.cashAmount > 0 && paidAmount === 0;
      const dueAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      const penalty = new Penalty({
        userId: order.userId._id,
        orderId: order._id,
        referenceNumber: order.referenceNumber,
        amount: penaltyAmount,
        status: cashOnly ? "pending_payment" : "deducted_from_voucher",
        dueAt,
        reason: "cancellation_after_processing",
      });
      await penalty.save({ session });
      order.paymentStatus = paidAmount > 0 ? "partial_refund" : "pending";

      try {
        await sendPenaltyEmail(
          order.userId,
          order.referenceNumber,
          penaltyAmount,
          dueAt,
          cashOnly ? "immediate" : "voucher"
        );
      } catch (emailError) {
        console.error("Error sending penalty email:", emailError);
      }
    }

    await Promise.all(
      order.items.map((item) =>
        Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: item.qty } },
          { session }
        )
      )
    );

    order.orderStatus = "cancelled";
    order.cancellationReason = cancellationReason || "User requested cancellation";
    order.penaltyAmount = penaltyAmount;

    order.trackingHistory.push({
      status: "cancelled",
      date: new Date(),
      note: cancellationReason || "User requested cancellation",
    });

    await order.save({ session });

    await session.commitTransaction();

    try {
      await sendOrderCancelledEmail(
        order.userId,
        order.referenceNumber,
        order.cancellationReason,
        refundAmount
      );
    } catch (emailError) {
      console.error("Error sending cancellation email:", emailError);
    }

    res.json(order);
  } catch (error) {
    await session.abortTransaction();
    console.error("Cancel order error:", error);
    res.status(500).json({ error: "Failed to cancel order" });
  } finally {
    session.endSession();
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  trackOrder,
  updateOrderStatus,
  cancelOrder,
};
