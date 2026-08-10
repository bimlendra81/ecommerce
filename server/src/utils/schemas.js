import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  phone: Joi.string().allow('', null).max(30),
});

export const profileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  phone: Joi.string().allow('', null).max(30),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().trim().min(10).required(),
  password: Joi.string().min(6).max(100).required(),
});

export const newsletterSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const moderateReviewSchema = Joi.object({
  approved: Joi.any().valid('0', '1', 0, 1, true, false).required(),
});

export const addToCartSchema = Joi.object({
  product_id: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().min(1).max(999),
});

export const updateCartSchema = Joi.object({
  quantity: Joi.number().integer().min(1).max(999).required(),
});

export const paymentCreateSchema = Joi.object({
  order_id: Joi.number().integer().positive().required(),
});

export const paymentVerifySchema = Joi.object({
  order_id: Joi.number().integer().positive().required(),
  gateway: Joi.string().valid('razorpay', 'stripe'),
  razorpay_order_id: Joi.string(),
  razorpay_payment_id: Joi.string(),
  razorpay_signature: Joi.string(),
  payment_intent_id: Joi.string(),
}).custom((value, helpers) => {
  const hasRazorpay = value.razorpay_order_id && value.razorpay_payment_id && value.razorpay_signature;
  if (value.payment_intent_id) {
    if (hasRazorpay) {
      return helpers.error('any.custom', { message: 'Provide either Stripe payment_intent_id or Razorpay fields, not both' });
    }
    return value;
  }
  if (hasRazorpay) return value;
  return helpers.error('any.custom', { message: 'Missing payment verification fields' });
});

export const paymentConfigSchema = Joi.object({
  payment_gateway: Joi.string().valid('razorpay', 'stripe', 'test').required(),
  payment_currency: Joi.string().trim().uppercase().length(3).required(),
  razorpay_key_id: Joi.string().trim().allow(''),
  razorpay_key_secret: Joi.string().trim().allow(''),
  stripe_secret_key: Joi.string().trim().allow(''),
  stripe_publishable_key: Joi.string().trim().allow(''),
  stripe_webhook_secret: Joi.string().trim().allow(''),
});

export const productSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().max(2000).allow('', null),
  price: Joi.number().positive().required(),
  sale_price: Joi.number().positive().allow('', null),
  sale_ends_at: Joi.date().iso().allow('', null),
  stock: Joi.number().integer().min(0).allow(''),
  category_id: Joi.number().integer().positive().allow('', null),
  brand_id: Joi.number().integer().positive().allow('', null),
  return_days: Joi.number().integer().min(1).max(365).allow('', null),
  weight_grams: Joi.number().integer().min(0).allow('', null),
  length_cm: Joi.number().min(0).allow('', null),
  width_cm: Joi.number().min(0).allow('', null),
  height_cm: Joi.number().min(0).allow('', null),
  dimension_unit: Joi.string().valid('cm', 'in').default('cm'),
  active: Joi.any().valid('0', '1', 0, 1, true, false),
  image: Joi.string().max(500).allow('', null),
  media: Joi.string().max(8000).allow('', null),
});

export const categorySchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  image: Joi.string().max(500).allow('', null),
  featured: Joi.any().valid('0', '1', 0, 1, true, false),
  featured_order: Joi.number().integer().min(0).allow('', null),
});

export const brandSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  active: Joi.any().valid('0', '1', 0, 1, true, false),
});

export const slideSchema = Joi.object({
  title: Joi.string().trim().max(200).allow('', null),
  subtitle: Joi.string().trim().max(500).allow('', null),
  link: Joi.string().max(500).allow('', null),
  sort_order: Joi.number().integer().allow('', null),
  active: Joi.any().valid('0', '1', 0, 1, true, false),
  image: Joi.string().max(500).allow('', null),
});

export const orderStatusSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'paid', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'returned', 'failed', 'cancelled')
    .required(),
});

export const updateUserSchema = Joi.object({
  active: Joi.boolean(),
  role: Joi.string().valid('user', 'admin'),
}).or('active', 'role');

export const addressSchema = Joi.object({
  full_name: Joi.string().trim().min(2).max(100).required(),
  phone: Joi.string().trim().max(30).required(),
  address_line1: Joi.string().trim().min(2).max(255).required(),
  address_line2: Joi.string().trim().allow('', null).max(255),
  city: Joi.string().trim().min(1).max(100).required(),
  state: Joi.string().trim().min(1).max(100).required(),
  postal_code: Joi.string().trim().min(2).max(20).required(),
  country: Joi.string().trim().min(2).max(100).default('IN'),
  is_default: Joi.boolean(),
});

export const shippingMethodSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  description: Joi.string().trim().max(255).allow('', null),
  fee: Joi.number().min(0).required(),
  estimated_days_min: Joi.number().integer().min(0).allow('', null),
  estimated_days_max: Joi.number().integer().min(0).allow('', null),
  active: Joi.any().valid('0', '1', 0, 1, true, false),
  sort_order: Joi.number().integer().allow('', null),
});

const shippingAddressSchema = Joi.object({
  full_name: Joi.string().trim().min(2).max(100).required(),
  phone: Joi.string().trim().max(30).required(),
  address_line1: Joi.string().trim().min(2).max(255).required(),
  address_line2: Joi.string().trim().allow('', null).max(255),
  city: Joi.string().trim().min(1).max(100).required(),
  state: Joi.string().trim().min(1).max(100).required(),
  postal_code: Joi.string().trim().min(2).max(20).required(),
  country: Joi.string().trim().min(2).max(100).default('IN'),
});

export const orderCreateSchema = Joi.object({
  shipping_method_id: Joi.number().integer().required(),
  address_id: Joi.number().integer().positive(),
  shipping_address: shippingAddressSchema,
  coupon_code: Joi.string().trim().max(50),
  shippo_rate_id: Joi.string().trim().max(200).allow('', null),
  shipping_service: Joi.string().trim().max(100).allow('', null),
  shipping_fee: Joi.number().min(0).allow('', null),
}).custom((value, helpers) => {
  if (!value.address_id && !value.shipping_address) {
    return helpers.message('address_id or shipping_address is required');
  }
  if (value.address_id && value.shipping_address) {
    return helpers.message('Provide either address_id or shipping_address, not both');
  }
  if (value.shippo_rate_id && value.shipping_method_id === 2147483647) {
    return helpers.message('Provide either a Shippo rate or the Shippo (International) method, not both');
  }
  return value;
});

export const updateShippingSchema = Joi.object({
  carrier: Joi.string().trim().max(100).allow('', null),
  tracking_number: Joi.string().trim().max(200).allow('', null),
  tracking_url: Joi.string().trim().max(500).allow('', null),
  notes: Joi.string().trim().max(1000).allow('', null),
  estimated_delivery: Joi.date().allow('', null),
}).or('carrier', 'tracking_number', 'tracking_url', 'notes', 'estimated_delivery');

export const addShippingEventSchema = Joi.object({
  event: Joi.string().trim().min(1).max(100).required(),
  location: Joi.string().trim().max(200).allow('', null),
  notes: Joi.string().trim().max(500).allow('', null),
});

export const quoteSchema = Joi.object({
  address_id: Joi.number().integer().positive(),
  shipping_address: shippingAddressSchema,
}).custom((value, helpers) => {
  if (!value.address_id && !value.shipping_address) {
    return helpers.message('address_id or shipping_address is required');
  }
  return value;
});

const boolish = Joi.any().valid('0', '1', 0, 1, true, false);

export const couponSchema = Joi.object({
  code: Joi.string().trim().min(1).max(50).required(),
  type: Joi.string().valid('percent', 'fixed').required(),
  value: Joi.number().min(0).required(),
  min_order_amount: Joi.number().min(0).allow('', null),
  max_discount: Joi.number().min(0).allow('', null),
  per_user_limit: Joi.number().integer().min(1).allow('', null),
  starts_at: Joi.date().iso().allow('', null),
  expires_at: Joi.date().iso().allow('', null),
  active: boolish,
}).custom((value, helpers) => {
  if (value.type === 'percent' && Number(value.value) > 100) {
    return helpers.message('Percent discount value cannot exceed 100');
  }
  if (value.expires_at && value.starts_at && new Date(value.expires_at) <= new Date(value.starts_at)) {
    return helpers.message('expires_at must be after starts_at');
  }
  return value;
});

export const couponValidateSchema = Joi.object({
  code: Joi.string().trim().min(1).max(50).required(),
  subtotal: Joi.number().min(0),
});

export const reviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  title: Joi.string().trim().max(200).allow('', null),
  comment: Joi.string().trim().max(5000).allow('', null),
});

export const categoryFeaturedSchema = Joi.object({
  featured: boolish.required(),
});

const urlOrEmpty = Joi.alternatives().try(
  Joi.string().uri({ scheme: ['http', 'https'] }),
  Joi.string().allow('', null)
);

export const settingsSchema = Joi.object({
  site_title: Joi.string().trim().max(200).allow('', null),
  site_tagline: Joi.string().max(500).allow('', null),
  facebook_url: urlOrEmpty,
  instagram_url: urlOrEmpty,
  contact_email: Joi.string().trim().email().allow('', null),
  contact_phone: Joi.string().max(50).allow('', null),
  free_shipping_threshold: Joi.number().min(0).allow('', null),
  return_days: Joi.number().integer().min(0).allow('', null),
  tax_enabled: boolish,
  tax_rate: Joi.number().min(0).max(100).allow('', null),
  tax_inclusive: boolish,
  reviews_auto_approve: boolish,
  smtp_host: Joi.string().max(200).allow('', null),
  smtp_port: Joi.string().max(10).allow('', null),
  smtp_secure: boolish,
  smtp_user: Joi.string().max(200).allow('', null),
  smtp_password: Joi.string().max(500).allow('', null),
  smtp_from: Joi.string().trim().email().allow('', null),
}).unknown(true);

export const shippingConfigSchema = Joi.object({
  shipping_provider: Joi.string().valid('manual', 'shiprocket', 'delhivery', 'shippo'),
  default_weight_grams: Joi.number().min(0).allow('', null),
  shipping_origin_name: Joi.string().max(200).allow('', null),
  shipping_origin_street1: Joi.string().max(255).allow('', null),
  shipping_origin_street2: Joi.string().max(255).allow('', null),
  shipping_origin_city: Joi.string().max(100).allow('', null),
  shipping_origin_state: Joi.string().max(100).allow('', null),
  shipping_origin_postcode: Joi.string().max(20).allow('', null),
  shipping_origin_country: Joi.string().max(100).allow('', null),
  shipping_boxes: Joi.string().allow('', null),
  shipping_clearance_factor: Joi.number().min(1).allow('', null),
  shippo_label_file_type: Joi.string().valid('PDF', 'PNG', 'ZPL').allow('', null),
  shiprocket_email: Joi.string().max(200).allow('', null),
  shiprocket_password: Joi.string().max(500).allow('', null),
  delhivery_api_token: Joi.string().max(500).allow('', null),
  delhivery_client_name: Joi.string().max(200).allow('', null),
  shippo_token: Joi.string().max(500).allow('', null),
}).unknown(true);

export const contactSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  email: Joi.string().trim().email().required(),
  message: Joi.string().trim().min(1).max(2000).required(),
});
