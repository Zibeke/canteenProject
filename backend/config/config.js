require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";

const requiredProductionVariables = [
  "DB_URI",
  "CLIENT_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_CALLBACK_URL",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "SESSION_SECRET",
  "ADMIN_EMAIL",
  "ADMIN_USERNAME",
  "ADMIN_PASSWORD",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "CLOUDINARY_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "SMTP_USER",
  "SMTP_PASSWORD",
];

if (isProduction) {
  const missingVariables = requiredProductionVariables.filter(
    (name) => !process.env[name]
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required production environment variables: ${missingVariables.join(", ")}`
    );
  }

  if (!process.env.CLIENT_URL.startsWith("https://")) {
    throw new Error("CLIENT_URL must use HTTPS in production");
  }

  if (!process.env.GOOGLE_CALLBACK_URL.startsWith("https://")) {
    throw new Error("GOOGLE_CALLBACK_URL must use HTTPS in production");
  }
}

const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction,

  port: Number(process.env.PORT || 5000),

  mongoUri: process.env.DB_URI,

  clientUrl: (
    process.env.CLIENT_URL || "http://localhost:3001"
  ).replace(/\/+$/, ""),

  useSecureCookies:
    isProduction ||
    String(process.env.CLIENT_URL || "").toLowerCase().startsWith("https://"),

  companyEmailDomain:
    process.env.COMPANY_EMAIL_DOMAIN || "company.co.za",

  allowAllEmails:
    String(process.env.ALLOW_ALL_EMAILS || "false").toLowerCase() === "true",

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL ||
      "http://localhost:5000/api/auth/google/callback"
  },

  jwt: {
    accessSecret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: "15m",
    refreshExpiresIn: "7d"
  },

  sessionSecret: process.env.SESSION_SECRET,

  adminEmail: process.env.ADMIN_EMAIL,
  adminUsername: process.env.ADMIN_USERNAME,
  adminPassword: process.env.ADMIN_PASSWORD,

  voucher: {
    monthlyAmount: Number(
      process.env.MONTHLY_VOUCHER_AMOUNT || 500
    ),
    maximumBalance: 500
  },

  canteen: {
    defaultClosingTime:
      process.env.DEFAULT_CANTEEN_CLOSING_TIME || "15:30",

    weekendClosingTime:
      process.env.WEEKEND_CLOSING_TIME || "14:00",

    closedOnSunday:
      String(process.env.CLOSED_ON_SUNDAY || "false").toLowerCase() ===
      "true",

    timezone:
      process.env.TIMEZONE || "Africa/Johannesburg"
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
  },

  mail: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure:
      String(process.env.SMTP_SECURE || "true").toLowerCase() === "true",
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from:
      process.env.MAIL_FROM ||
      process.env.SMTP_USER ||
      "CANTEEN <lizoxolo9@gmail.com>"
  }
};

module.exports = config;
