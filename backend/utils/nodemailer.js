const nodemailer = require("nodemailer");
const config = require("../config/config");

const transporter = nodemailer.createTransport({
  host: config.mail.host,
  port: config.mail.port,
  secure: config.mail.secure,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 20000,
  auth: {
    user: config.mail.user,
    pass: config.mail.password?.replace(/\s+/g, ""),
  },
});

const verifyEmailTransport = async () => {
  if (!config.mail.user || !config.mail.password) {
    throw new Error("SMTP_USER and SMTP_PASSWORD must be configured");
  }

  await transporter.verify();
};

const sendEmail = async (to, subject, html) => {
  const mailOptions = {
    from: config.mail.from,
    to,
    subject,
    html,
  };

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const result = await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${to} (messageId: ${result.messageId})`);
      return result;
    } catch (error) {
      lastError = error;
      console.error(
        `Email attempt ${attempt}/3 failed for ${to}:`,
        {
          message: error.message,
          code: error.code,
          command: error.command,
          responseCode: error.responseCode,
          response: error.response,
        }
      );

      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }
  }

  throw lastError;
};

const sendOrderConfirmationEmail = async (user, order, referenceNumber) => {
  const orderAmount =
    Number(order.totalAmount || 0) +
    Number(order.paymentBreakdown?.voucherAmount || 0);
  const subject = `Order Confirmed - Reference: ${referenceNumber}`;
  const html = `
    <h2>Order Confirmed!</h2>
    <p>Dear ${user.name},</p>
    <p>Your order has been confirmed and is being prepared.</p>
    <p><strong>Reference Number: ${referenceNumber}</strong></p>
    <p><strong>Total Amount: R${orderAmount.toFixed(2)}</strong></p>
    <p>You can collect your order at the Canteen Counter.</p>
    <p>Thank you for ordering!</p>
  `;
  await sendEmail(user.email, subject, html);
};

const sendCashOrderConfirmationEmail = async (user, order, referenceNumber) => {
  const subject = `Order Received - Payment Pending - Reference: ${referenceNumber}`;
  const html = `
    <h2>Order Received - Payment Pending</h2>
    <p>Dear ${user.name},</p>
    <p>Your order has been received and is waiting for payment at the Canteen Till.</p>
    <p><strong>Reference Number: ${referenceNumber}</strong></p>
    <p><strong>Amount due at the Till: R${order.paymentBreakdown.cashAmount.toFixed(2)}</strong></p>
    <p>Your order is not paid yet. Payment will be confirmed after payment at the Till.</p>
  `;
  await sendEmail(user.email, subject, html);
};

const sendOrderReadyEmail = async (user, referenceNumber) => {
  const subject = `Order Ready - Reference: ${referenceNumber}`;
  const html = `
    <h2>Your Order is Ready!</h2>
    <p>Dear ${user.name},</p>
    <p>Your order is ready for collection at the Canteen Counter.</p>
    <p><strong>Reference Number: ${referenceNumber}</strong></p>
    <p>Please collect within 30 minutes.</p>
    <p>Thank you!</p>
  `;
  await sendEmail(user.email, subject, html);
};

const sendOrderCancelledEmail = async (user, referenceNumber, reason, refund = 0) => {
  const subject = `Order Cancelled - Reference: ${referenceNumber}`;
  const html = `
    <h2>Order Cancelled</h2>
    <p>Dear ${user.name},</p>
    <p>Your order (Reference: ${referenceNumber}) has been cancelled.</p>
    <p><strong>Reason: ${reason}</strong></p>
    ${refund > 0 ? `<p><strong>Refund Amount: R${refund}</strong></p>` : ""}
    <p>Thank you for understanding.</p>
  `;
  await sendEmail(user.email, subject, html);
};

const sendPenaltyEmail = async (user, referenceNumber, penaltyAmount, dueAt, emailType = "immediate") => {
  let subject, html;

  if (emailType === "immediate") {
    subject = `Order Cancelled - R${penaltyAmount} Penalty Due in 2 days - Ref: ${referenceNumber}`;
    html = `
      <h2>Order Cancelled - Penalty Notice</h2>
      <p>Dear ${user.name},</p>
      <p>Your order (Reference: ${referenceNumber}) has been cancelled.</p>
      <p><strong>Penalty Amount: R${penaltyAmount}</strong></p>
      <p><strong>Due Date: ${new Date(dueAt).toLocaleString()}</strong></p>
      <p>You can pay this penalty at the Till within 2 days. If it is not paid, it will be deducted from your voucher balance.</p>
      <p>Policy: Cancellations after processing incur a 25% penalty to discourage abuse.</p>
    `;
  } else if (emailType === "voucher") {
    subject = `Order Cancelled - R${penaltyAmount} Voucher Adjustment - Ref: ${referenceNumber}`;
    html = `
      <h2>Order Cancelled - Voucher Adjustment</h2>
      <p>Dear ${user.name},</p>
      <p>Your order (Reference: ${referenceNumber}) has been cancelled after preparation started.</p>
      <p><strong>Cancellation charge: R${penaltyAmount}</strong></p>
      <p>The charge has been applied to your voucher balance. The remaining eligible amount has been returned.</p>
    `;
  } else if (emailType === "8h") {
    subject = `Reminder: R${penaltyAmount} Penalty for ${referenceNumber} - 16h left`;
    html = `
      <h2>Penalty Payment Reminder</h2>
      <p>Dear ${user.name},</p>
      <p>Reminder: You have 16 hours left to pay the R${penaltyAmount} penalty at the Till.</p>
      <p>Reference: ${referenceNumber}</p>
      <p>If not paid, it will be deducted from your voucher.</p>
    `;
  } else if (emailType === "20h") {
    subject = `FINAL: R${penaltyAmount} Penalty Due in 4h - ${referenceNumber}`;
    html = `
      <h2>FINAL Penalty Notice</h2>
      <p>Dear ${user.name},</p>
      <p>FINAL NOTICE: You have 4 hours to pay the R${penaltyAmount} penalty at the Till.</p>
      <p>Reference: ${referenceNumber}</p>
      <p>After 4 hours, this amount will be automatically deducted from your voucher.</p>
    `;
  }

  await sendEmail(user.email, subject, html);
};

const sendPenaltyDeductedEmail = async (user, penaltyAmount, newBalance) => {
  const subject = `Penalty Deducted from Voucher`;
  const html = `
    <h2>Penalty Deducted</h2>
    <p>Dear ${user.name},</p>
    <p>A penalty of R${penaltyAmount} has been deducted from your voucher balance.</p>
    <p><strong>New Voucher Balance: R${newBalance}</strong></p>
    <p>This was done as per the cancellation penalty policy.</p>
  `;
  await sendEmail(user.email, subject, html);
};

const sendVoucherCreditEmail = async (user, amount, month) => {
  const subject = `Your R${amount} Canteen Voucher for ${month} Credited`;
  const html = `
    <h2>Monthly Voucher Credited</h2>
    <p>Dear ${user.name},</p>
    <p>Your monthly Canteen voucher of <strong>R${amount}</strong> for ${month} has been credited to your account.</p>
    <p>Voucher Balance: <strong>R${amount}</strong></p>
    <p>Use it to order from the Canteen. Any amount exceeding R500 will be deducted from your salary at month end.</p>
    <p>Thank you!</p>
  `;
  await sendEmail(user.email, subject, html);
};

const sendClosingReminderEmail = async (user, referenceNumber, closingTime) => {
  const timeLeft = 60;
  const subject = `Canteen Closing in ${timeLeft} Minutes - Collect Order ${referenceNumber}`;
  const html = `
    <h2>Canteen Closing Soon</h2>
    <p>Dear ${user.name},</p>
    <p>The Canteen closes at ${closingTime} today.</p>
    <p>Please collect your order (Reference: ${referenceNumber}) before closing time.</p>
    <p>You have approximately ${timeLeft} minutes.</p>
  `;
  await sendEmail(user.email, subject, html);
};

const sendAdminClosingReminderEmail = async (adminEmail, closingTime, defaultUsed) => {
  const subject = `Canteen Closing Time Reminder - ${closingTime}`;
  const html = `
    <h2>Canteen Closing Time</h2>
    <p>The Canteen is set to close today at ${closingTime}.</p>
    ${defaultUsed ? `<p><strong>Note: Default closing time was used (not manually updated).</strong></p>` : ""}
    <p>Please ensure all orders are processed and ready for collection.</p>
  `;
  await sendEmail(adminEmail, subject, html);
};

module.exports = {
  sendEmail,
  verifyEmailTransport,
  sendOrderConfirmationEmail,
  sendCashOrderConfirmationEmail,
  sendOrderReadyEmail,
  sendOrderCancelledEmail,
  sendPenaltyEmail,
  sendPenaltyDeductedEmail,
  sendVoucherCreditEmail,
  sendClosingReminderEmail,
  sendAdminClosingReminderEmail,
};
