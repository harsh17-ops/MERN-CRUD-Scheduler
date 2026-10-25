/** Reject protected API requests without a valid server-side login session. */
export default function requireAuth(request, response, next) {
  if (!request.session?.userId) {
    return response.status(401).json({ message: 'Sign in to continue.' });
  }
  return next();
}
