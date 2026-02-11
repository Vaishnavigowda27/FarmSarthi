import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay Order
export const createOrder = async (amount, receipt, notes = {}) => {
  try {
    const options = {
      amount: Math.round(amount * 100), // Amount in paise
      currency: 'INR',
      receipt: receipt,
      notes: notes,
    };

    const order = await razorpay.orders.create(options);
    return {
      success: true,
      order,
    };
  } catch (error) {
    console.error('Razorpay Order Creation Error:', error);
    throw new Error('Failed to create payment order');
  }
};

// Verify Razorpay Payment Signature
export const verifyPaymentSignature = (orderId, paymentId, signature) => {
  try {
    const text = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    return generatedSignature === signature;
  } catch (error) {
    console.error('Signature Verification Error:', error);
    return false;
  }
};

// Get Payment Details
export const getPaymentDetails = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return {
      success: true,
      payment,
    };
  } catch (error) {
    console.error('Razorpay Payment Fetch Error:', error);
    throw new Error('Failed to fetch payment details');
  }
};

// Initiate Refund
export const initiateRefund = async (paymentId, amount, notes = {}) => {
  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: Math.round(amount * 100), // Amount in paise
      notes: notes,
    });

    return {
      success: true,
      refund,
    };
  } catch (error) {
    console.error('Razorpay Refund Error:', error);
    throw new Error('Failed to initiate refund');
  }
};

// Calculate advance payment amount
export const calculateAdvancePayment = (totalAmount) => {
  const advancePercentage = parseInt(process.env.ADVANCE_PAYMENT_PERCENTAGE) || 10;
  return (totalAmount * advancePercentage) / 100;
};