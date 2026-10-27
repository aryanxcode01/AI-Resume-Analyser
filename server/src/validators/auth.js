import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.').max(254),
  password: z
    .string()
    .min(12, 'Use a password with at least 12 characters.')
    .max(128, 'Password must be 128 characters or fewer.'),
});

export const loginSchema = registerSchema;
