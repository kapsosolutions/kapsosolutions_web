// Simple bearer-token guard for admin APIs (matches ADMIN_TOKEN from .env).
export function requireAdmin(req, res, next) {
  const token = (req.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  const expected = process.env.ADMIN_TOKEN || 'kapso_admin_session_token_2026';
  if (token && token === expected) return next();
  return res.status(401).json({ success: false, message: 'Unauthorized' });
}

export default { requireAdmin };
