const Joi = require("joi");

const validateProduct = (data) => {
  const schema = Joi.object({
    name: Joi.string().max(150).required(),
    description: Joi.string().max(2000).required(),
    price: Joi.number().min(0).precision(2).required(),
    stock: Joi.number().min(0).required(),
    category: Joi.string()
      .valid("Hot Food", "Cold Drinks", "Snacks", "Breakfast")
      .required(),
    isSpecial: Joi.boolean(),
    specialPrice: Joi.number().min(0).precision(2).allow(null),
    isAvailableToday: Joi.boolean(),
  }).unknown(false);

  return schema.validate(data);
};

const validateAddToCart = (data) => {
  const schema = Joi.object({
    productId: Joi.string().required(),
    qty: Joi.number().min(1).required(),
  }).unknown(false);

  return schema.validate(data);
};

const validateUpdateCart = (data) => {
  const schema = Joi.object({
    items: Joi.array()
      .items(
        Joi.object({
          productId: Joi.string().required(),
          qty: Joi.number().min(1).required(),
        })
      )
      .required(),
  }).unknown(false);

  return schema.validate(data);
};

const validateCheckout = (data) => {
  const schema = Joi.object({
    paymentMethod: Joi.string()
      .valid("pay_by_voucher", "pay_by_card", "cash_at_till")
      .required(),
    items: Joi.array()
      .items(
        Joi.object({
          productId: Joi.string().required(),
          qty: Joi.number().min(1).required(),
        })
      )
      .required(),
  }).unknown(false);

  return schema.validate(data);
};

const validateOrderCancel = (data) => {
  const schema = Joi.object({
    cancellationReason: Joi.string().max(500),
  }).unknown(false);

  return schema.validate(data);
};

const validateCanteenConfig = (data) => {
  const schema = Joi.object({
    closingTime: Joi.string()
      .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .required(),
  }).unknown(false);

  return schema.validate(data);
};

module.exports = {
  validateProduct,
  validateAddToCart,
  validateUpdateCart,
  validateCheckout,
  validateOrderCancel,
  validateCanteenConfig,
};
