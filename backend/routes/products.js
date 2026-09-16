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

const handleUpload = (req, res, next) => {
  upload.array("images", 5)(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      error.status = 400;
      error.message =
        error.code === "LIMIT_FILE_SIZE"
          ? "Each image must be 2 MB or smaller"
          : error.code === "LIMIT_FILE_COUNT" ||
              error.code === "LIMIT_UNEXPECTED_FILE"
            ? "You can upload up to 5 images"
            : "Invalid image upload";
    } else {
      error.status = 400;
    }

    next(error);
  });
};

router.get("/", getAllProducts);
router.get("/specials", getSpecials);
router.get("/:slug", getProductBySlug);
router.post("/", auth, isAdmin, handleUpload, createProduct);
router.put("/:id", auth, isAdmin, handleUpload, updateProduct);
router.delete("/:id", auth, isAdmin, deleteProduct);

module.exports = router;
