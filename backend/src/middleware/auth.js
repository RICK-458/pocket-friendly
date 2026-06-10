import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError.js';

// Validates the Bearer token and attaches { id, name, email } as req.user.
// Every finance route is mounted behind this middleware.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new ApiError(401, 'Authentication required — please log in'));

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, name: payload.name, email: payload.email };
    next();
  } catch {
    next(new ApiError(401, 'Session expired or invalid — please log in again'));
  }
}
