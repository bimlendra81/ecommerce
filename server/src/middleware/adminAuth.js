import { auth } from './auth.js';

export function adminAuth(req, res, next) {
  auth(req, res, (err) => {
    if (err) return next(err);
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  });
}
