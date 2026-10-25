import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const router = Router();
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_BYTES = 72;

function publicUser(user) {
  return { id: user._id.toString(), email: user.email };
}

function regenerateSession(request) {
  return new Promise((resolve, reject) => {
    request.session.regenerate((error) => (error ? reject(error) : resolve()));
  });
}

function saveSession(request) {
  return new Promise((resolve, reject) => {
    request.session.save((error) => (error ? reject(error) : resolve()));
  });
}

router.get('/me', async (request, response, next) => {
  try {
    if (!request.session.userId) {
      return response.status(401).json({ message: 'Not signed in.' });
    }
    const user = await User.findById(request.session.userId);
    if (!user) {
      request.session.destroy(() => {});
      return response.status(401).json({ message: 'Session is no longer valid.' });
    }
    return response.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.post('/register', async (request, response, next) => {
  try {
    const email = String(request.body?.email || '').trim().toLowerCase();
    const password = request.body?.password;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return response.status(400).json({ message: 'Enter a valid email address.' });
    }
    if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) {
      return response.status(400).json({ message: 'Password must be at least 8 characters.' });
    }
    if (bcrypt.truncates(password) || Buffer.byteLength(password, 'utf8') > PASSWORD_MAX_BYTES) {
      return response.status(400).json({ message: 'Password must be 72 bytes or fewer.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email, passwordHash });
    await regenerateSession(request);
    request.session.userId = user._id.toString();
    await saveSession(request);
    return response.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      return response.status(409).json({ message: 'An account with that email already exists.' });
    }
    return next(error);
  }
});

router.post('/login', async (request, response, next) => {
  try {
    const email = String(request.body?.email || '').trim().toLowerCase();
    const password = request.body?.password;
    const user = await User.findOne({ email }).select('+passwordHash');
    // Use one generic response for unknown accounts and wrong passwords.
    if (!user || typeof password !== 'string' || !(await bcrypt.compare(password, user.passwordHash))) {
      return response.status(401).json({ message: 'Email or password is incorrect.' });
    }

    await regenerateSession(request);
    request.session.userId = user._id.toString();
    await saveSession(request);
    return response.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.post('/logout', (request, response, next) => {
  request.session.destroy((error) => {
    if (error) return next(error);
    response.clearCookie('taskflow.sid', { path: '/' });
    return response.status(204).end();
  });
});

export default router;
