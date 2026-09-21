// File: backend/controllers/productController.js

const Product = require("../models/Product");
const { validateProduct } = require("../utils/validators");
const generateSlug = require("../utils/generateSlug");
const path = require("path");
const fs = require("fs/promises");
const sharp = require("sharp");
const { uploadImage, deleteImage } = require("../utils/cloudinary");

const uploadProductImages = async (files) => {
  const images = [];

  for (const file of files) {
    const imageBuffer = await sharp(file.buffer)
      .resize(400, 400, { fit: "cover" })
      .webp({ quality: 80 })
      .toBuffer();

    const publicId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    images.push(await uploadImage(imageBuffer, publicId));
  }

  return images;
};

const deleteStoredImage = async (image) => {
  if (image?.startsWith("/uploads/")) {
    try {
      await fs.unlink(path.join(__dirname, "..", image));
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
    return;
  }

  await deleteImage(image);
};

const getAllProducts = async (req, res) => {
  try {
    const { category, page = 1, limit = 12, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    if (category && category !== "All") {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const products = await Product.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Product.countDocuments(query);

    res.json({
      products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

const getSpecials = async (req, res) => {
  try {
    const specials = await Product.find({ isSpecial: true }).lean();
    res.json(specials);
  } catch (error) {
    console.error("Get specials error:", error);
    res.status(500).json({ error: "Failed to fetch specials" });
  }
};

const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({ slug }).lean();

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
};

const createProduct = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "At least one product image is required" });
    }

    const { error, value } = validateProduct(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const slug = generateSlug(value.name);
    const existingProduct = await Product.findOne({ slug });

    if (existingProduct) {
      return res.status(400).json({ error: "Product name already exists" });
    }

    const images = await uploadProductImages(req.files);

    const product = new Product({
      name: value.name,
      slug,
      description: value.description,
      price: Number(Number(value.price).toFixed(2)),
      stock: value.stock,
      category: value.category,
      images,
      isSpecial: value.isSpecial || false,
      specialPrice:
        value.specialPrice == null
          ? null
          : Number(Number(value.specialPrice).toFixed(2)),
      isAvailableToday: value.isAvailableToday !== false,
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ error: "Failed to create product" });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = validateProduct(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    let images = product.images;
    let previousImages = [];

    if (req.files && req.files.length > 0) {
      previousImages = [...product.images];
      images = await uploadProductImages(req.files);
    }

    const slug = value.name !== product.name ? generateSlug(value.name) : product.slug;
    const slugExists = await Product.findOne({ slug, _id: { $ne: id } });

    if (slugExists) {
      return res.status(400).json({ error: "Product name already exists" });
    }

    Object.assign(product, {
      name: value.name,
      slug,
      description: value.description,
      price: value.price,
      stock: value.stock,
      category: value.category,
      images,
      isSpecial: value.isSpecial || false,
      specialPrice: value.specialPrice,
      isAvailableToday: value.isAvailableToday !== false,
    });

    await product.save();

    for (const image of previousImages) {
      await deleteStoredImage(image);
    }

    res.json(product);
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    for (const image of product.images) {
      await deleteStoredImage(image);
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
};

module.exports = {
  getAllProducts,
  getSpecials,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
};
