import Razorpay from 'razorpay';
import crypto from 'crypto';

// Check if Razorpay credentials are valid
const hasValidCredentials = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  // Check if credentials exist and are not dummy values
  if (!keyId || !keySecret) return false;
  if (keyId === 'rzp_test_dummy' || keyId === 'dummy_key') return false;
  if (keySecret === 'dummy_secret') return false;
  
  return true;
};

// Initialize Razorpay instance only if valid credentials exist
let razorpay = null;

if (hasValidCredentials()) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  console.log(' Razorpay initialized with valid credentials');
} else {
  console.log('  Razorpay running in MOCK mode (no valid credentials)');
}

// Create Razorpay Order
export const createOrder = async (amount, receipt, notes = {}) => {
  try {
    // If no valid Razorpay credentials, return mock order
    if (!razorpay) {
      console.log('🧪 Creating MOCK Razorpay order');
      const mockOrder = {
        id: `order_mock_${Date.now()}`,
        entity: 'order',
        amount: Math.round(amount * 100),
        amount_paid: 0,
        amount_due: Math.round(amount * 100),
        currency: 'INR',
        receipt: receipt,
        status: 'created',
        attempts: 0,
        notes: notes,
        created_at: Math.floor(Date.now() / 1000)
      };
      
      return {
        success: true,
        order: mockOrder,
      };
    }

    // Real Razorpay order creation
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
    // In mock mode, accept any signature
    if (!razorpay) {
      console.log(' MOCK signature verification - always passes');
      return true;
    }

    // Real signature verification
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
    // Mock payment details
    if (!razorpay) {
      console.log(' Getting MOCK payment details');
      return {
        success: true,
        payment: {
          id: paymentId,
          entity: 'payment',
          amount: 21000,
          currency: 'INR',
          status: 'captured',
          method: 'card',
          captured: true,
          created_at: Math.floor(Date.now() / 1000)
        },
      };
    }

    // Real payment fetch
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
    // Mock refund
    if (!razorpay) {
      console.log('🧪 Creating MOCK refund');
      return {
        success: true,
        refund: {
          id: `rfnd_mock_${Date.now()}`,
          entity: 'refund',
          amount: Math.round(amount * 100),
          currency: 'INR',
          payment_id: paymentId,
          notes: notes,
          status: 'processed',
          created_at: Math.floor(Date.now() / 1000)
        },
      };
    }

    // Real refund
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

// Calculate non-refundable service charge (percentage of total)
export const calculateServiceCharge = (totalAmount) => {
  const percentage = parseFloat(process.env.SERVICE_CHARGE_PERCENTAGE) || 2;
  return (totalAmount * percentage) / 100;
};