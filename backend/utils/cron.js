const cron = require("node-cron");
const mongoose = require("mongoose");
const User = require("../models/User");
const Voucher = require("../models/Voucher");
const Order = require("../models/Order");
const Penalty = require("../models/Penalty");
const CanteenConfig = require("../models/CanteenConfig");
const PayrollDeduction = require("../models/PayrollDeduction");
const config = require("../config/config");
const stripe = require("stripe")(config.stripe.secretKey);
const {
  sendVoucherCreditEmail,
  sendPenaltyEmail,
  sendPenaltyDeductedEmail,
  sendClosingReminderEmail,
  sendOrderCancelledEmail,
  sendOrderConfirmationEmail,
  sendCashOrderConfirmationEmail,
  sendAdminClosingReminderEmail,
} = require("./nodemailer");
const generateReference = require("./generateReference");

// CRON 1: Monthly Voucher Distribution on the 5th at 00:01
const distributeMonthlyVouchers = async () => {
  const now = new Date();
  if (now.getDate() < 5) {
    return;
  }

  const users = await User.find({});
  const currentMonth = now.toISOString().slice(0, 7);
  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + 1, 5);
  expiresAt.setHours(0, 0, 0, 0);
  for (const user of users) {
    const voucherExists = await Voucher.findOne({
      userId: user._id,
      month: currentMonth,
    });

    if (voucherExists && user.voucherBalance < 0) {
      await User.updateOne(
        { _id: user._id },
        { $max: { voucherBalance: 0 } }
      );
    }

    if (!voucherExists) {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        await Voucher.create(
          [{
            userId: user._id,
            code: `VOUCH-${user._id}-${currentMonth}`,
            amount: config.voucher.monthlyAmount,
            remainingAmount: config.voucher.monthlyAmount,
            originalAmount: config.voucher.monthlyAmount,
            month: currentMonth,
            isUsed: false,
            expiresAt,
          }],
          { session }
        );
        await User.updateOne(
          { _id: user._id },
          {
            $set: {
              voucherBalance: config.voucher.monthlyAmount,
              lastVoucherMonth: currentMonth,
              voucherExpiresAt: expiresAt,
            },
          },
          { session }
        );
        await session.commitTransaction();
        await sendVoucherCreditEmail(user, config.voucher.monthlyAmount, currentMonth);
      } catch (emailError) {
        if (session.inTransaction()) {
          await session.abortTransaction();
        }
        console.error(`Error distributing voucher to ${user.email}:`, emailError);
      } finally {
        session.endSession();
      }
    }
  }
};

const monthlyVoucherCron = () => {
  cron.schedule("1 0 5 * *", async () => {
    console.log("Running monthly voucher distribution cron...");
    try {
      await distributeMonthlyVouchers();
      console.log("Monthly voucher distribution completed.");
    } catch (error) {
      console.error("Error in monthly voucher cron:", error);
    }
  });
};

const orderEmailRetryCron = () => {
  cron.schedule("*/5 * * * *", async () => {
    try {
      const retrySince = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const orders = await Order.find({
        createdAt: { $gte: retrySince },
        confirmationEmailSentAt: null,
        $or: [
          { paymentStatus: "paid" },
          {
            paymentStatus: "pending",
            cashPaymentStatus: "pending_at_till",
          },
        ],
      }).populate("userId");

      for (const order of orders) {
        try {
          if (order.cashPaymentStatus === "pending_at_till") {
            await sendCashOrderConfirmationEmail(
              order.userId,
              order,
              order.referenceNumber
            );
          } else {
            await sendOrderConfirmationEmail(
              order.userId,
              order,
              order.referenceNumber
            );
          }
          order.confirmationEmailSentAt = new Date();
          await order.save();
        } catch (error) {
          console.error(
            `Order email retry failed for ${order.referenceNumber}:`,
            error.message
          );
        }
      }
    } catch (error) {
      console.error("Order email retry cron failed:", error);
    }
  });
};

// CRON 2: Penalty Reminder & Auto-Deduction (Hourly)
const penaltyCron = () => {
  cron.schedule("0 * * * *", async () => {
    console.log("Running penalty cron...");
    try {
      const now = new Date();

      // Find all pending penalties
      const penalties = await Penalty.find({
        status: "pending_payment",
      }).populate("userId");

      for (const penalty of penalties) {
        const timeUntilDue = penalty.dueAt.getTime() - now.getTime();
        const hoursUntilDue = timeUntilDue / (1000 * 60 * 60);

        // Send 8h reminder
        if (
          hoursUntilDue <= 8 &&
          hoursUntilDue > 7.9 &&
          !penalty.reminder8hSentAt
        ) {
          try {
            await sendPenaltyEmail(
              penalty.userId,
              penalty.referenceNumber,
              penalty.amount,
              penalty.dueAt,
              "8h"
            );
            penalty.reminder8hSentAt = now;
            await penalty.save();
          } catch (emailError) {
            console.error("Error sending 8h penalty reminder:", emailError);
          }
        }

        // Send 20h reminder
        if (
          hoursUntilDue <= 20 &&
          hoursUntilDue > 19.9 &&
          !penalty.reminder20hSentAt
        ) {
          try {
            await sendPenaltyEmail(
              penalty.userId,
              penalty.referenceNumber,
              penalty.amount,
              penalty.dueAt,
              "20h"
            );
            penalty.reminder20hSentAt = now;
            await penalty.save();
          } catch (emailError) {
            console.error("Error sending 20h penalty reminder:", emailError);
          }
        }

        // Auto-deduct after 24h
        if (timeUntilDue <= 0) {
          const session = await mongoose.startSession();
          session.startTransaction();

          try {
            const user = await User.findByIdAndUpdate(
              penalty.userId,
              [
                {
                  $set: {
                    voucherBalance: {
                      $max: [
                        0,
                        { $subtract: ["$voucherBalance", penalty.amount] },
                      ],
                    },
                  },
                },
              ],
              { new: true, session }
            );

            penalty.status = "deducted_from_voucher";
            await penalty.save({ session });

            await session.commitTransaction();

            try {
              await sendPenaltyDeductedEmail(
                user,
                penalty.amount,
                Math.max(0, user.voucherBalance)
              );
            } catch (emailError) {
              console.error("Error sending deduction email:", emailError);
            }
          } catch (error) {
            await session.abortTransaction();
            console.error("Error auto-deducting penalty:", error);
          } finally {
            session.endSession();
          }
        }
      }

      console.log("Penalty cron completed.");
    } catch (error) {
      console.error("Error in penalty cron:", error);
    }
  });
};

// CRON 3: Canteen Closure Reminders (Every 5 minutes)
const closureReminderCron = () => {
  cron.schedule("*/5 * * * *", async () => {
    console.log("Running closure reminder cron...");
    try {
      const today = new Date().toISOString().slice(0, 10);
      const config_doc = await CanteenConfig.findOne({ date: today });

      if (!config_doc) {
        return;
      }

      const [closingHour, closingMinute] = config_doc.closingTime
        .split(":")
        .map(Number);
      const closingTime = new Date();
      closingTime.setHours(closingHour, closingMinute, 0, 0);

      const now = new Date();
      const timeUntilClose = closingTime.getTime() - now.getTime();
      const minutesUntilClose = Math.floor(timeUntilClose / (1000 * 60));

      // 60 minute reminder
      if (minutesUntilClose === 60) {
        const openOrders = await Order.find({
          orderStatus: { $in: ["pending", "confirmed", "processing", "ready_for_collection"] },
          createdAt: { $gte: new Date(today) },
        }).populate("userId");

        for (const order of openOrders) {
          try {
            await sendClosingReminderEmail(
              order.userId,
              order.referenceNumber,
              config_doc.closingTime
            );
          } catch (emailError) {
            console.error("Error sending 60min reminder:", emailError);
          }
        }
      }

      // 30 minute reminder
      if (minutesUntilClose === 30) {
        const openOrders = await Order.find({
          orderStatus: { $in: ["pending", "confirmed", "processing", "ready_for_collection"] },
          createdAt: { $gte: new Date(today) },
        }).populate("userId");

        for (const order of openOrders) {
          try {
            await sendClosingReminderEmail(
              order.userId,
              order.referenceNumber,
              config_doc.closingTime
            );
          } catch (emailError) {
            console.error("Error sending 30min reminder:", emailError);
          }
        }
      }

      // Auto-close at closing time
      if (now >= closingTime && minutesUntilClose <= 0) {
        console.log("Auto-closing canteen for today...");

        const openOrders = await Order.find({
          orderStatus: { $in: ["pending", "confirmed", "processing", "ready_for_collection"] },
          createdAt: { $gte: new Date(today) },
        }).populate("userId");

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
          for (const order of openOrders) {
            if (order.paymentStatus === "paid") {
              const voucherPaid = order.paymentBreakdown.voucherAmount;
              const cardPaid = order.paymentBreakdown.cardAmount;
              const refundAmount = Math.round(
                (voucherPaid + cardPaid) * 0.75 * 100
              ) / 100;
              const penaltyAmount = Math.round(
                (voucherPaid + cardPaid) * 0.25 * 100
              ) / 100;
              const voucherRefund = Math.round(voucherPaid * 0.75 * 100) / 100;
              const cardRefund = Math.round(cardPaid * 0.75 * 100) / 100;

              if (voucherRefund > 0) {
                await User.findByIdAndUpdate(
                  order.userId,
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

              order.orderStatus = "cancelled";
              order.cancellationReason = "canteen_closed";
              order.paymentStatus = "partial_refund";
              order.penaltyAmount = penaltyAmount;

              const penalty = new Penalty({
                userId: order.userId,
                orderId: order._id,
                referenceNumber: order.referenceNumber,
                amount: penaltyAmount,
                status: "deducted_from_voucher",
                dueAt: now,
                reason: "canteen_closed",
              });

              await penalty.save({ session });
              await order.save({ session });

              try {
                await sendOrderCancelledEmail(
                  order.userId,
                  order.referenceNumber,
                  "Canteen closed",
                  refundAmount
                );
              } catch (emailError) {
                console.error("Error sending cancellation email:", emailError);
              }
            } else if (order.paymentStatus === "pending") {
              // Create 24h penalty
              const penaltyAmount = Math.round(order.totalAmount * 0.25 * 100) / 100;
              const dueAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

              const penalty = new Penalty({
                userId: order.userId,
                orderId: order._id,
                referenceNumber: order.referenceNumber,
                amount: penaltyAmount,
                status: "pending_payment",
                dueAt,
                reason: "canteen_closed",
              });

              await penalty.save({ session });

              order.orderStatus = "cancelled";
              order.cancellationReason = "canteen_closed";
              await order.save({ session });

              try {
                await sendOrderCancelledEmail(
                  order.userId,
                  order.referenceNumber,
                  "Canteen closed - not collected"
                );
              } catch (emailError) {
                console.error("Error sending cancellation email:", emailError);
              }
            }
          }

          await session.commitTransaction();
        } catch (error) {
          await session.abortTransaction();
          console.error("Error closing canteen:", error);
        } finally {
          session.endSession();
        }
      }

      console.log("Closure reminder cron completed.");
    } catch (error) {
      console.error("Error in closure reminder cron:", error);
    }
  });
};

// CRON 4: Auto-create CanteenConfig for today at midnight
const autoCreateConfigCron = () => {
  cron.schedule("0 0 * * *", async () => {
    console.log("Running auto-create config cron...");
    try {
      const today = new Date().toISOString().slice(0, 10);

      const exists = await CanteenConfig.findOne({ date: today });

      if (!exists) {
        await CanteenConfig.create({
          date: today,
          closingTime: config.canteen.defaultClosingTime,
          lastUpdatedBy: "system",
          isAutoCloseEnabled: true,
          manuallyUpdated: false,
        });

        console.log(`Auto-created CanteenConfig for ${today}`);

        // Send admin reminder email at 8am
        if (new Date().getHours() === 8) {
          try {
            await sendAdminClosingReminderEmail(
              config.mail.user,
              config.canteen.defaultClosingTime,
              true
            );
          } catch (emailError) {
            console.error("Error sending admin reminder:", emailError);
          }
        }
      }

      console.log("Auto-create config cron completed.");
    } catch (error) {
      console.error("Error in auto-create config cron:", error);
    }
  });
};

const initializeCrons = () => {
  console.log("Initializing cron jobs...");
  monthlyVoucherCron();
  orderEmailRetryCron();
  penaltyCron();
  closureReminderCron();
  autoCreateConfigCron();
  console.log("Cron jobs initialized.");
};

module.exports = { initializeCrons, distributeMonthlyVouchers };
