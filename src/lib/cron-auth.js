// lib/cron-auth.js
// Call verifyCronAuth(req) at the top of every /api/cron/* handler.
// Vercel automatically sends the CRON_SECRET in the Authorization header
// when invoking cron jobs. Any other caller without the secret gets a 401.

export function verifyCronAuth(req) {
  if (!process.env.CRON_SECRET) {
    throw new Error('Missing env var: CRON_SECRET');
  }

  const authHeader = req.headers.authorization;

  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}
