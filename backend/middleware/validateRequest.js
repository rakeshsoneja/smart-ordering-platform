const { body, validationResult } = require('express-validator');

/**
 * Validation Middleware
 * Validates request body and returns errors if validation fails
 */

const validateRequest = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    next();
  };
};

// Common validation rules
const orderValidationRules = [
  body('customerName')
    .trim()
    .notEmpty()
    .withMessage('Customer name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Customer name must be between 2 and 255 characters'),
  
  body('customerPhone')
    .trim()
    .notEmpty()
    .withMessage('Customer phone is required')
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
    .withMessage('Invalid phone number format'),
  
  body('deliveryAddress')
    .trim()
    .notEmpty()
    .withMessage('Delivery address is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Delivery address must be between 10 and 500 characters'),
  
  body('cartItems')
    .isArray({ min: 1 })
    .withMessage('Cart items must be a non-empty array'),
  
  body('cartItems.*.name')
    .notEmpty()
    .withMessage('Item name is required'),
  
  body('cartItems.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Item quantity must be a positive integer'),
  
  body('cartItems.*.price')
    .isFloat({ min: 0 })
    .withMessage('Item price must be a positive number'),
  
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  
  body('paymentMode')
    .isIn(['razorpay', 'cod'])
    .withMessage('Payment mode must be either "razorpay" or "cod"'),
];

const paymentVerificationRules = [
  body('razorpayOrderId')
    .notEmpty()
    .withMessage('Razorpay order ID is required'),
  
  body('razorpayPaymentId')
    .notEmpty()
    .withMessage('Razorpay payment ID is required'),
  
  body('razorpaySignature')
    .notEmpty()
    .withMessage('Razorpay signature is required'),
];

module.exports = {
  validateRequest,
  orderValidationRules,
  paymentVerificationRules,
};








