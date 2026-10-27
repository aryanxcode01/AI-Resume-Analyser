import { describe, expect, it } from 'vitest';
import {
  createAccessToken,
  hashPassword,
  readAccessToken,
  verifyPassword,
} from '../src/services/auth-service.js';

describe('authentication service', () => {
  it('hashes passwords and validates a matching password', async () => {
    const hash = await hashPassword('a-long-test-password');
    expect(hash).not.toContain('a-long-test-password');
    await expect(verifyPassword('a-long-test-password', hash)).resolves.toBe(true);
    await expect(verifyPassword('another-password', hash)).resolves.toBe(false);
  });

  it('creates a token with the authenticated user as subject', () => {
    const token = createAccessToken('user-123');
    expect(readAccessToken(token).sub).toBe('user-123');
  });
});
