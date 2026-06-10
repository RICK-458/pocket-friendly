import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import ApiError from '../utils/ApiError.js';

// Lazy client so the server can boot before keys are configured.
let client = null;

export function getRazorpayKeyId() {
  return process.env.RAZORPAY_KEY_ID;
}

function getClient() {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new ApiError(
      503,
      'Razorpay is not configured. Add your test-mode RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env ' +
        '(dashboard.razorpay.com → Settings → API Keys → Generate Test Key) and restart the backend.'
    );
  }
  if (!client) client = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
  return client;
}

// Creates a Razorpay order. `amount` is in rupees; Razorpay wants paise.
export async function createOrder({ amount, note, recipientName }) {
  try {
    return await getClient().orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `pf_${Date.now()}`,
      notes: {
        app: 'pocket-friendly',
        ...(note ? { note } : {}),
        ...(recipientName ? { recipient: recipientName } : {}),
      },
    });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    // Razorpay SDK errors carry { statusCode, error: { description } }
    const description = err?.error?.description || err.message || 'Razorpay order creation failed';
    throw new ApiError(502, `Razorpay error: ${description}`);
  }
}

// HMAC-SHA256("<order_id>|<payment_id>", key_secret) must equal the signature
// Razorpay Checkout returns. Constant-time comparison prevents timing attacks.
export function verifySignature({ orderId, paymentId, signature }) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature || '', 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Fetch payment details (method, vpa, bank, wallet…) — best-effort only.
export async function fetchPaymentDetails(paymentId) {
  try {
    return await getClient().payments.fetch(paymentId);
  } catch {
    return null;
  }
}
