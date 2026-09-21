const crypto = require("crypto");
const axios = require("axios");

const getConfig = () => ({
  cloudName: process.env.CLOUDINARY_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
});

const getSignature = (params, apiSecret) => {
  const stringToSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(`${stringToSign}${apiSecret}`)
    .digest("hex");
};

const ensureConfigured = () => {
  const config = getConfig();

  if (!config.cloudName || !config.apiKey || !config.apiSecret) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
    );
  }

  return config;
};

const uploadImage = async (buffer, publicId) => {
  const config = ensureConfigured();
  const timestamp = Math.floor(Date.now() / 1000);
  const params = {
    folder: "canteen/products",
    public_id: publicId,
    timestamp,
  };
  const form = new FormData();

  form.append("file", new Blob([buffer], { type: "image/webp" }), `${publicId}.webp`);
  form.append("api_key", config.apiKey);
  form.append("timestamp", String(timestamp));
  form.append("folder", params.folder);
  form.append("public_id", publicId);
  form.append("signature", getSignature(params, config.apiSecret));

  const response = await axios.post(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
    form
  );

  return response.data.secure_url;
};

const deleteImage = async (imageUrl) => {
  if (!imageUrl || !imageUrl.includes("res.cloudinary.com")) {
    return;
  }

  const config = ensureConfigured();
  const url = new URL(imageUrl);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const uploadIndex = pathParts.indexOf("upload");
  const publicIdParts = pathParts.slice(uploadIndex + 1);

  if (publicIdParts[0]?.startsWith("v")) {
    publicIdParts.shift();
  }

  const lastPart = publicIdParts.pop();
  if (!lastPart) {
    return;
  }

  publicIdParts.push(lastPart.replace(/\.[^/.]+$/, ""));
  const publicId = publicIdParts.join("/");
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { public_id: publicId, timestamp };

  await axios.post(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/image/destroy`,
    new URLSearchParams({
      public_id: publicId,
      timestamp: String(timestamp),
      api_key: config.apiKey,
      signature: getSignature(params, config.apiSecret),
    })
  );
};

module.exports = { uploadImage, deleteImage };
