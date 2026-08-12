import express from 'express';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import brandRoutes from './routes/brands.js';
import slideRoutes from './routes/slides.js';
import homeRoutes from './routes/home.js';
import settingsRoutes from './routes/settings.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payment.js';
import adminRoutes from './routes/admin.js';
import adminShippingRoutes from './routes/adminShipping.js';
import adminPaymentRoutes from './routes/adminPayment.js';
import wishlistRoutes from './routes/wishlist.js';
import addressRoutes from './routes/addresses.js';
import shippingRoutes from './routes/shipping.js';
import couponRoutes from './routes/coupons.js';
import newsletterRoutes from './routes/newsletter.js';
import contactRoutes from './routes/contact.js';
import { stripeWebhook } from './controllers/paymentController.js';
import { UPLOAD_DIR } from './utils/upload.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { testConnection } from './config/db.js';
import { startTrackingSyncCron } from './services/shipping/tracking.js';
import { startCronJobs } from './jobs/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(compression());
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }), stripeWebhook);
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/slides', slideRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminShippingRoutes);
app.use('/api/admin', adminPaymentRoutes);
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '1d', setHeaders: (res, filePath) => {
  if (/\.(png|jpe?g|gif|webp|svg|ico|mp4|webm)$/i.test(filePath)) {
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
} }));

app.use(notFound);
app.use(errorHandler);

testConnection();

app.listen(PORT, () => {
  console.log(`[server] API running on http://localhost:${PORT}`);
});

startTrackingSyncCron();
startCronJobs();
