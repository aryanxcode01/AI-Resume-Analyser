import { ApiError } from '../errors/api-error.js';
import { readAccessToken } from '../services/auth-service.js';

export function requireAuth(request, _response, next) {
  const [scheme, token] = request.get('authorization')?.split(' ') ?? [];
  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'AUTH_REQUIRED', 'Sign in to continue.'));
  }
  try {
    request.userId = readAccessToken(token).sub;
    return next();
  } catch (error) {
    return next(error);
  }
}
