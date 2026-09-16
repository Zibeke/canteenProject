const Order = require("../models/Order");
const Penalty = require("../models/Penalty");
const User = require("../models/User");
const PayrollDeduction = require("../models/PayrollDeduction");
const CanteenConfig = require("../models/CanteenConfig");
const mongoose = require("mongoose");
const config = require("../config/config");
const stripe = require("stripe")(config.stripe.secretKey);
const { sendEmail, verifyEmailTransport } = require("../utils/nodemailer");

const testEmailDelivery = async (req, res) => {
  if (config.isProduction) {
    return res.status(404).json({ error: "Email test is disabled in production" });
  }

  const recipient = req.body?.recipient || config.mail.user;
  if (typeof recipient !== "string" || !recipient.includes("@")) {
    return res.status(400).json({ error: "A valid recipient email is required" });
  }

  try {
    await verifyEmailTransport();
    await sendEmail(
      recipient,
      "Canteen development email test",
      `<p>Email delivery test succeeded.</p><p>Sent at ${new Date().toISOString()}.</p>`
    );
    console.log(`Development email test succeeded for ${recipient}`);
    res.json({ success: true, recipient });
  } catch (error) {
    console.error("Development email test failed:", {
      message: error.message,
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
      response: error.response,
      stack: error.stack,
    });
    res.status(502).json({
      error: "Email delivery test failed",
      details: error.message,
    });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = await Order.find({ createdAt: { $gte: today } });
    const todayRevenue = todayOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );
    const openOrdersCount = await Order.countDocuments({
      orderStatus: { $in: ["pending", "confirmed", "processing"] },
    });
    const pendingPenalties = await Penalty.countDocuments({
      status: "pending_payment",
    });
    const canteenConfig = await CanteenConfig.findOne({
      date: today.toISOString().slice(0, 10),
    });

    res.json({
      todayRevenue,
      todayOrders: todayOrders.length,
      openOrdersCount,
      pendingPenalties,
      closingTime: canteenConfig?.closingTime || "15:30",
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const { status, referenceNumber, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const query = {};

    if (status) query.orderStatus = status;
    if (referenceNumber) {
      query.referenceNumber = { $regex: referenceNumber, $options: "i" };
    }

    const orders = await Order.find(query)
      .populate("userId", "email name")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const ordersWithPaymentMethod = orders.map((order) => {
      const breakdown = order.paymentBreakdown;
      const paymentMethod =
        breakdown.voucherAmount > 0 && breakdown.cardAmount > 0
          ? "voucher_and_card"
          : breakdown.voucherAmount > 0
            ? "voucher"
            : breakdown.cardAmount > 0
              ? "card"
              : breakdown.cashAmount > 0
                ? "cash_at_till"
                : "unknown";

      return { ...order.toObject(), paymentMethod };
    });

    const total = await Order.countDocuments(query);
    res.json({
      orders: ordersWithPaymentMethod,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get all orders error:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

const getPenalties = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const query = {};

    if (status) query.status = status;

    const penalties = await Penalty.find(query)
      .populate("userId", "email name")
      .populate("orderId", "referenceNumber")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    const total = await Penalty.countDocuments(query);

    res.json({
      penalties,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get penalties error:", error);
    res.status(500).json({ error: "Failed to fetch penalties" });
  }
};

const markPenaltyAsPaid = async (req, res) => {
  try {
    const penalty = await Penalty.findByIdAndUpdate(
      req.params.id,
      { status: "paid_at_till", paidAt: new Date() },
      { new: true }
    ).populate("userId");

    if (!penalty) return res.status(404).json({ error: "Penalty not found" });
    res.json(penalty);
  } catch (error) {
    console.error("Mark penalty paid error:", error);
    res.status(500).json({ error: "Failed to mark penalty as paid" });
  }
};

const waivePenalty = async (req, res) => {
  try {
    const penalty = await Penalty.findByIdAndUpdate(
      req.params.id,
      { status: "waived" },
      { new: true }
    ).populate("userId");

    if (!penalty) return res.status(404).json({ error: "Penalty not found" });
    res.json(penalty);
  } catch (error) {
    console.error("Waive penalty error:", error);
    res.status(500).json({ error: "Failed to waive penalty" });
  }
};

const getVouchers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const users = await User.find({ isActive: true })
      .select("email name voucherBalance monthlyVoucherCap")
      .skip(skip)
      .limit(parseInt(limit));
    const total = await User.countDocuments({ isActive: true });

    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get vouchers error:", error);
    res.status(500).json({ error: "Failed to fetch vouchers" });
  }
};

const getPayrollReport = async (req, res) => {
  try {
    const { month } = req.query;
    if (!month || !month.match(/^\d{4}-\d{2}$/)) {
      return res.status(400).json({ error: "Invalid month format (YYYY-MM)" });
    }

    const deductions = await PayrollDeduction.find({ month }).populate(
      "userId",
      "email name"
    );
    const report = deductions.map((deduction) => ({
      email: deduction.userId.email,
      name: deduction.userId.name,
      totalVoucherUsed: deduction.totalVoucherUsed,
      extraOwed: deduction.extraOwed,
      totalToDeduct: deduction.totalToDeduct,
      status: deduction.status,
    }));

    res.json({ month, report, total: report.length });
  } catch (error) {
    console.error("Get payroll report error:", error);
    res.status(500).json({ error: "Failed to fetch payroll report" });
  }
};

const getCanteenConfig = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    let canteenConfig = await CanteenConfig.findOne({ date: today });

    if (!canteenConfig) {
      canteenConfig = await CanteenConfig.create({
        date: today,
        closingTime: process.env.DEFAULT_CANTEEN_CLOSING_TIME || "15:30",
        lastUpdatedBy: "system",
        isAutoCloseEnabled: true,
        manuallyUpdated: false,
      });
    }

    res.json(canteenConfig);
  } catch (error) {
    console.error("Get canteen config error:", error);
    res.status(500).json({ error: "Failed to fetch canteen config" });
  }
};

const updateCanteenConfig = async (req, res) => {
  try {
    const { closingTime } = req.body;
    if (!closingTime || !closingTime.match(/^([01]\d|2[0-3]):([0-5]\d)$/)) {
      return res
        .status(400)
        .json({ error: "Invalid closing time format (HH:MM)" });
    }

    const today = new Date().toISOString().slice(0, 10);
    let canteenConfig = await CanteenConfig.findOneAndUpdate(
      { date: today },
      {
        closingTime,
        lastUpdatedBy: req.user.email,
        manuallyUpdated: true,
      },
      { new: true }
    );

    if (!canteenConfig) {
      canteenConfig = await CanteenConfig.create({
        date: today,
        closingTime,
        lastUpdatedBy: req.user.email,
        manuallyUpdated: true,
        isAutoCloseEnabled: true,
      });
    }

    res.json(canteenConfig);
  } catch (error) {
    console.error("Update canteen config error:", error);
    res.status(500).json({ error: "Failed to update canteen config" });
  }
};

const closeCanteenNow = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const today = new Date().toISOString().slice(0, 10);
    const openOrders = await Order.find({
      orderStatus: {
        $in: ["pending", "confirmed", "processing", "ready_for_collection"],
      },
      createdAt: { $gte: new Date(today) },
    })
      .populate("userId")
      .session(session);

    for (const order of openOrders) {
      if (order.paymentStatus === "paid") {
        const voucherPaid = order.paymentBreakdown.voucherAmount;
        const cardPaid = order.paymentBreakdown.cardAmount;
        const penaltyAmount = Math.round(
          (voucherPaid + cardPaid) * 0.25 * 100
        ) / 100;
        const voucherRefund = Math.round(voucherPaid * 0.75 * 100) / 100;
        const cardRefund = Math.round(cardPaid * 0.75 * 100) / 100;

        if (voucherRefund > 0) {
          await User.findByIdAndUpdate(
            order.userId._id,
            { $inc: { voucherBalance: voucherRefund } },
            { session }
          );
        }
        if (cardRefund > 0 && order.stripePaymentIntentId) {
          await stripe.refunds.create({
            payment_intent: order.stripePaymentIntentId,
            amount: Math.round(cardRefund * 100),
          });
        }

        await new Penalty({
          userId: order.userId._id,
          orderId: order._id,
          referenceNumber: order.referenceNumber,
          amount: penaltyAmount,
          status: "deducted_from_voucher",
          dueAt: new Date(),
          reason: "canteen_closed",
        }).save({ session });

        order.orderStatus = "cancelled";
        order.cancellationReason = "canteen_closed";
        order.paymentStatus = "partial_refund";
        order.penaltyAmount = penaltyAmount;
      } else if (order.paymentStatus === "pending") {
        const penaltyAmount = Math.round(order.totalAmount * 0.25 * 100) / 100;
        const dueAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await new Penalty({
          userId: order.userId._id,
          orderId: order._id,
          referenceNumber: order.referenceNumber,
          amount: penaltyAmount,
          status: "pending_payment",
          dueAt,
          reason: "canteen_closed",
        }).save({ session });

        order.orderStatus = "cancelled";
        order.cancellationReason = "canteen_closed";
      }

      order.trackingHistory.push({
        status: "cancelled",
        date: new Date(),
        note: "Canteen closed",
      });
      await order.save({ session });
    }

    await session.commitTransaction();
    res.json({
      message: "Canteen closed successfully",
      closedOrdersCount: openOrders.length,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Close canteen error:", error);
    res.status(500).json({ error: "Failed to close canteen" });
  } finally {
    session.endSession();
  }
};

module.exports = {
  testEmailDelivery,
  getDashboardStats,
  getAllOrders,
  getPenalties,
  markPenaltyAsPaid,
  waivePenalty,
  getVouchers,
  getPayrollReport,
  getCanteenConfig,
  updateCanteenConfig,
  closeCanteenNow,
};
