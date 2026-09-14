const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  getAllProducts,
  getSpecials,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
    }
  },
});

router.get("/", getAllProducts);
router.get("/specials", getSpecials);
router.get("/:slug", getProductBySlug);
router.post("/", auth, isAdmin, upload.array("images", 5), createProduct);
router.put("/:id", auth, isAdmin, upload.array("images", 5), updateProduct);
router.delete("/:id", auth, isAdmin, deleteProduct);

module.exports = router;
