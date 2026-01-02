# Cloudinary Image Upload Setup Guide

## Overview
The admin panel now supports image uploads for products using Cloudinary. Images are uploaded to Cloudinary and the secure URL is stored in the database.

## Setup Steps

### 1. Create Cloudinary Account
1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Once logged in, go to Dashboard
4. Copy your credentials:
   - Cloud Name
   - API Key
   - API Secret

### 2. Configure Environment Variables

Add the following to your `backend/.env` file:

```env
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 3. Restart Backend Server

After adding the environment variables, restart your backend server:

```bash
cd backend
npm run dev
```

## Features

### Image Upload
- **Accepted formats**: JPEG, PNG, WebP
- **Max file size**: 5 MB
- **Storage location**: Cloudinary folder `products/`
- **Image optimization**: Automatic resizing and quality optimization

### Admin UI
- **Desktop**: Form on left, image preview on right
- **Tablet**: Image preview below form
- **Mobile**: Image preview stacked vertically
- **Preview**: Shows selected image before upload
- **Remove**: Option to remove selected image

### Product Display
- Products with Cloudinary URLs display the uploaded image
- Products without images or with emoji fallback to emoji display
- Automatic fallback if image fails to load

## API Endpoints

### POST /api/admin/products
Create a new product with image upload
- Content-Type: `multipart/form-data`
- Field name for image: `image`

### PUT /api/admin/products/:id
Update a product with optional image upload
- Content-Type: `multipart/form-data`
- Field name for image: `image`
- If new image is uploaded, old image is automatically deleted from Cloudinary

## Error Handling

- **File type validation**: Only image files accepted
- **File size validation**: Max 5 MB
- **Upload errors**: Displayed in UI
- **Network errors**: Clear error messages

## Testing

1. Navigate to `/admin` in your browser
2. Click "Add Product"
3. Fill in product details
4. Select an image file
5. Preview should appear
6. Submit the form
7. Image should upload and product should be created
8. Check the home page to see the uploaded image

