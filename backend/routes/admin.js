const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const {
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
  testEmailDelivery,
} = require("../controllers/adminController");

router.use(auth, isAdmin);

router.get("/dashboard/stats", getDashboardStats);
router.get("/orders", getAllOrders);
router.get("/penalties", getPenalties);
router.put("/penalties/:id/mark-paid", markPenaltyAsPaid);
router.put("/penalties/:id/waive", waivePenalty);
router.get("/vouchers", getVouchers);
router.get("/payroll-report", getPayrollReport);
router.get("/canteen-config", getCanteenConfig);
router.put("/canteen-config", updateCanteenConfig);
router.post("/canteen/close-now", closeCanteenNow);
router.post("/email-test", testEmailDelivery);

module.exports = router;
