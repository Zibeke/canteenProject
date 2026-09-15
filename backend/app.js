const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const passport = require("passport");
const session = require("express-session");
const path = require("path");
const config = require("./config/config");
const webhookRoutes = require("./routes/webhooks");
require("./config/passport");

const app = express();

app.set("trust proxy", 1);

// Security middleware
app.use(helmet({
  hsts: { maxAge: 31536000, includeSubDomains: true },
  xssFilter: true,
  noSniff: true,
  frameguard: { action: "deny" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(cors({
  origin: [config.clientUrl],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Stripe must receive the raw request body for signature verification.
app.use("/api/webhook", webhookRoutes);

// Body parser
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ limit: "10kb", extended: true }));
app.use(cookieParser());

// Data sanitization
app.use(mongoSanitize());
app.use(hpp());

// Session configuration
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.isProduction,
    httpOnly: true,
    sameSite: config.isProduction ? "none" : "lax",
  },
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const cartRoutes = require("./routes/cart");
const ordersRoutes = require("./routes/orders");
const adminRoutes = require("./routes/admin");
const paymentRoutes = require("./routes/payments");

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Sitemap
app.get("/api/sitemap.xml", async (req, res) => {
  try {
    const Product = require("./models/Product");
    const products = await Product.find({ isAvailableToday: true }).select("slug updatedAt");

    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Static pages
    const staticPages = ["", "/about", "/cart", "/my-orders"];
    staticPages.forEach((page) => {
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${config.clientUrl}${page}</loc>\n`;
      sitemap += `    <priority>1.0</priority>\n`;
      sitemap += `  </url>\n`;
    });

    // Products
    products.forEach((product) => {
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${config.clientUrl}/product/${product.slug}</loc>\n`;
      sitemap += `    <lastmod>${product.updatedAt.toISOString()}</lastmod>\n`;
      sitemap += `    <priority>0.8</priority>\n`;
      sitemap += `  </url>\n`;
    });

    sitemap += "</urlset>";

    res.type("application/xml");
    res.send(sitemap);
  } catch (error) {
    console.error("Sitemap generation error:", error);
    res.status(500).send("Error generating sitemap");
  }
});

// Robots.txt
app.get("/robots.txt", (req, res) => {
  const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /checkout
Disallow: /my-orders
Sitemap: ${config.clientUrl}/api/sitemap.xml`;

  res.type("text/plain");
  res.send(robots);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: "The requested resource does not exist",
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Error:", error);

  const status = error.status || 500;
  const message = config.isProduction
    ? "Internal Server Error"
    : error.message;

  res.status(status).json({ error: message });
});

module.exports = app;
