require("dotenv").config();
const fs = require("fs/promises");
const path = require("path");
const app = require("./app");
const connectDatabase = require("./config/db");
const config = require("./config/config");
const CanteenConfig = require("./models/CanteenConfig");
const { initializeCrons, distributeMonthlyVouchers } = require("./utils/cron");
const { verifyEmailTransport } = require("./utils/nodemailer");

async function startServer() {
  try {
    await fs.mkdir(path.join(__dirname, "uploads"), { recursive: true });

    // Connect to database
    await connectDatabase();
    console.log("Database connected successfully");

    try {
      await verifyEmailTransport();
      console.log("Email transport verified.");
    } catch (error) {
      console.error("Email transport verification failed:", error.message);
    }

    // Initialize cron jobs
    await distributeMonthlyVouchers();
    initializeCrons();
    console.log("Cron jobs initialized");

    // Auto-create CanteenConfig for today
    const today = new Date().toISOString().slice(0, 10);
    const existingConfig = await CanteenConfig.findOne({ date: today });

    if (!existingConfig) {
      await CanteenConfig.create({
        date: today,
        closingTime: config.canteen.defaultClosingTime,
        lastUpdatedBy: "system",
        isAutoCloseEnabled: true,
        manuallyUpdated: false,
      });
      console.log(`Auto-created CanteenConfig for ${today}`);
    }

    // Start server
    const port = config.port;
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
