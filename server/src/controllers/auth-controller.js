import { ApiError } from '../errors/api-error.js';
import { User } from '../models/user.js';
import { createAccessToken, hashPassword, verifyPassword } from '../services/auth-service.js';
import { loginSchema, registerSchema } from '../validators/auth.js';

function publicUser(user) {
  return { id: user.id, email: user.email, createdAt: user.createdAt };
}

export async function register(request, response) {
  const input = registerSchema.parse(request.body);
  const email = input.email.toLowerCase();
  if (await User.exists({ email })) {
    throw new ApiError(409, 'EMAIL_IN_USE', 'An account already exists for that email address.');
  }
  const user = await User.create({ email, passwordHash: await hashPassword(input.password) });
  response.status(201).json({ user: publicUser(user), accessToken: createAccessToken(user.id) });
}

export async function login(request, response) {
  const input = loginSchema.parse(request.body);
  const user = await User.findOne({ email: input.email.toLowerCase() }).select('+passwordHash');
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  }
  response.json({ user: publicUser(user), accessToken: createAccessToken(user.id) });
}

export async function me(request, response) {
  const user = await User.findById(request.userId);
  if (!user) throw new ApiError(401, 'INVALID_TOKEN', 'Your session is invalid or has expired.');
  response.json({ user: publicUser(user) });
}
