require("dotenv").config();

const fs = require("fs/promises");
const path = require("path");
const connectDatabase = require("../config/db");
const Product = require("../models/Product");
const { uploadImage } = require("../utils/cloudinary");

const migrateProductImages = async () => {
  await connectDatabase();

  const products = await Product.find({ images: /^\/uploads\// });
  let migrated = 0;

  for (const product of products) {
    const images = [];

    for (const image of product.images) {
      const imagePath = path.join(__dirname, "..", image);

      try {
        const buffer = await fs.readFile(imagePath);
        const publicId = `${product.slug}-${Date.now()}-${migrated}`;
        images.push(await uploadImage(buffer, publicId));
        migrated += 1;
      } catch (error) {
        if (error.code === "ENOENT") {
          console.error(`Missing legacy image: ${image}`);
          images.push(image);
          continue;
        }

        throw error;
      }
    }

    product.images = images;
    await product.save();
  }

  console.log(`Migrated ${migrated} product image(s) to Cloudinary.`);
};

migrateProductImages()
  .catch((error) => {
    console.error("Image migration failed:", error);
    process.exitCode = 1;
  });
