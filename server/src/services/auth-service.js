import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../errors/api-error.js';

const passwordRounds = 12;

function getJwtSecret() {
  if (!env.jwtSecret) {
    throw new ApiError(503, 'AUTH_NOT_CONFIGURED', 'Authentication is not configured.');
  }
  return env.jwtSecret;
}

export function hashPassword(password) {
  return bcrypt.hash(password, passwordRounds);
}

export function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

export function createAccessToken(userId) {
  return jwt.sign({ sub: userId }, getJwtSecret(), {
    expiresIn: '7d',
    issuer: 'ai-resume-analyzer',
  });
}

export function readAccessToken(token) {
  try {
    return jwt.verify(token, getJwtSecret(), { issuer: 'ai-resume-analyzer' });
  } catch {
    throw new ApiError(401, 'INVALID_TOKEN', 'Your session is invalid or has expired.');
  }
}
