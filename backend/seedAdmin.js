require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const config = require("./config/config");

async function seedAdmin() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log("Connected to MongoDB");

    const adminEmail = config.adminEmail;

    if (!adminEmail) {
      console.error("ADMIN_EMAIL not set in environment variables");
      process.exit(1);
    }

    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      if (existingAdmin.role === "admin") {
        console.log(`Admin user ${adminEmail} already exists`);
        await mongoose.connection.close();
        process.exit(0);
      }

      console.error(
        `Cannot seed admin: ${adminEmail} already belongs to a non-admin user`
      );
      await mongoose.connection.close();
      process.exit(1);
    }

    const admin = new User({
      googleId: `seed-admin-${Date.now()}`,
      email: adminEmail,
      name: "Admin",
      picture: "",
      role: "admin",
      employeeId: "ADMIN-001",
      voucherBalance: 500,
      monthlyVoucherCap: 500,
      isActive: true,
      lastLoginAt: new Date(),
    });

    await admin.save();
    console.log(`Admin user ${adminEmail} created successfully`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding admin:", error);
    process.exit(1);
  }
}

seedAdmin();
