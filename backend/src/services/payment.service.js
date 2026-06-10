import { pool, query } from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import { todayStr } from '../utils/dates.js';
import * as razorpay from './razorpay.service.js';

const TX_METHODS = ['upi', 'card', 'netbanking', 'wallet', 'emi', 'paylater'];

// ─── Create order ────────────────────────────────────────────────────────────
// Creates a Razorpay order and records the attempt as a pending payment row.
export async function createOrder(userId, { amount, recipient_name, note }) {
  const order = await razorpay.createOrder({ amount, note, recipientName: recipient_name });

  await query(
    `INSERT INTO payments (user_id, razorpay_order_id, amount, currency, status, recipient_name, note)
     VALUES ($1, $2, $3, $4, 'pending', $5, $6)`,
    [userId, order.id, amount, order.currency, recipient_name || null, note || null]
  );

  return {
    orderId: order.id,
    amount,
    amountPaise: order.amount,
    currency: order.currency,
    keyId: razorpay.getRazorpayKeyId(), // public key — safe to expose
  };
}

// ─── Verify + finalize ───────────────────────────────────────────────────────
// Validates the checkout signature, then atomically: marks the payment row
// success, records it in transactions (payment history) and expenses (so the
// dashboard and analytics reflect it). Scoped to the order's owner.
export async function verifyAndFinalize(userId, { razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  const { rows } = await query(
    'SELECT * FROM payments WHERE razorpay_order_id = $1 AND user_id = $2',
    [razorpay_order_id, userId]
  );
  const payment = rows[0];
  if (!payment) throw ApiError.notFound('No payment found for this order — create an order first');
  if (payment.status === 'success') return getPaymentById(userId, payment.id); // idempotent

  const valid = razorpay.verifySignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!valid) {
    await query(
      `UPDATE payments SET status = 'failed', razorpay_payment_id = $2, error_reason = 'Invalid signature'
       WHERE id = $1`,
      [payment.id, razorpay_payment_id]
    );
    throw ApiError.badRequest('Payment verification failed: invalid signature');
  }

  // Best-effort: ask Razorpay which method was actually used
  const details = await razorpay.fetchPaymentDetails(razorpay_payment_id);
  const method = TX_METHODS.includes(details?.method) ? details.method : 'other';
  const recipientLabel =
    payment.recipient_name || details?.vpa || details?.wallet || details?.bank || 'Razorpay';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: expRows } = await client.query(
      `INSERT INTO expenses (user_id, title, amount, category, expense_date, notes)
       VALUES ($1, $2, $3, 'Other', $4, $5) RETURNING id`,
      [userId, `Payment to ${recipientLabel}`, payment.amount, todayStr(), payment.note || null]
    );

    const { rows: txRows } = await client.query(
      `INSERT INTO transactions (user_id, amount, recipient, recipient_name, note, method, expense_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        userId,
        payment.amount,
        details?.vpa || `razorpay:${razorpay_payment_id}`,
        payment.recipient_name || null,
        payment.note || null,
        method,
        expRows[0].id,
      ]
    );

    await client.query(
      `UPDATE payments SET status = 'success', razorpay_payment_id = $2, method = $3,
              error_reason = NULL, transaction_id = $4
       WHERE id = $1`,
      [payment.id, razorpay_payment_id, details?.method || null, txRows[0].id]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return getPaymentById(userId, payment.id);
}

// ─── Failed / cancelled attempts ─────────────────────────────────────────────
export async function markFailed(userId, razorpay_order_id, reason) {
  const { rows } = await query(
    `UPDATE payments SET status = 'failed', error_reason = $3
     WHERE razorpay_order_id = $1 AND user_id = $2 AND status <> 'success'
     RETURNING *`,
    [razorpay_order_id, userId, reason || 'Payment failed or cancelled']
  );
  if (!rows[0]) throw ApiError.notFound('No pending payment found for this order');
  return rows[0];
}

// ─── Reads ───────────────────────────────────────────────────────────────────
export async function listPayments(userId, { limit = 50, status } = {}) {
  const params = [userId];
  let where = 'WHERE user_id = $1';
  if (status) {
    params.push(status);
    where += ` AND status = $${params.length}`;
  }
  params.push(limit);
  const { rows } = await query(
    `SELECT * FROM payments ${where} ORDER BY created_at DESC, id DESC LIMIT $${params.length}`,
    params
  );
  return rows;
}

export async function getPaymentById(userId, id) {
  const { rows } = await query(
    'SELECT * FROM payments WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return rows[0] || null;
}
