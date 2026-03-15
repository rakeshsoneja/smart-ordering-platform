#!/usr/bin/env node
/**
 * Generate UPI payment QR code and upload to Cloudinary.
 * Run once to create the QR, then add UPI_QR_IMAGE_URL to .env
 *
 * Required env: SHOP_UPI_ID, SHOP_NAME (optional), CLOUDINARY_*
 * Usage: npm run generate:upi-qr
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const QRCode = require('qrcode');
const cloudinary = require('cloudinary').v2;

const SHOP_UPI_ID = process.env.SHOP_UPI_ID;
const SHOP_NAME = process.env.SHOP_NAME || 'Shop';

if (!SHOP_UPI_ID) {
  console.error('❌ SHOP_UPI_ID is required. Add it to .env');
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upiString = `upi://pay?pa=${encodeURIComponent(SHOP_UPI_ID)}&pn=${encodeURIComponent(SHOP_NAME)}&cu=INR`;

async function main() {
  const buffer = await QRCode.toBuffer(upiString, { type: 'png', margin: 2, width: 256 });

  const result = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'upi',
        resource_type: 'image',
        format: 'png',
        public_id: 'upi-payment-qr',
        overwrite: true,
      },
      (error, res) => (error ? reject(error) : resolve(res))
    );
    uploadStream.end(buffer);
  });

  console.log('\n✅ UPI QR uploaded to Cloudinary.');
  console.log('Add this to your .env:\n');
  console.log(`UPI_QR_IMAGE_URL=${result.secure_url}\n`);
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
