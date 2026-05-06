// lib/cron-auth.js
// Call verifyCronAuth(request) at the top of every /api/cron/* handler.
// Vercel automatically sends the CRON_SECRET in the Authorization header
// when invoking cron jobs. Any other caller without the secret gets a 401.

export function verifyCronAuth(request) {
  if (!process.env.CRON_SECRET) {
    throw new Error('Missing env var: CRON_SECRET');
  }

  // Support both Web API style (Headers object) and Node.js style (plain object)
  const authHeader =
    typeof request.headers?.get === 'function'
      ? request.headers.get('authorization')
      : request.headers?.authorization;

  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}
