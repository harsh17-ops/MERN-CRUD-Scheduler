import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';

const app = express();
const port = Number(process.env.PORT) || 3000;
const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const buildDirectory = path.resolve(serverDirectory, '../dist');
const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000;

app.use(express.json({ limit: '20kb' }));
app.get('/api/health', (request, response) => {
  response.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Mongoose validation and malformed IDs become client errors; unexpected errors stay generic.
function handleErrors(error, request, response, next) {
  if (response.headersSent) return next(error);
  const isClientError = ['ValidationError', 'CastError', 'SyntaxError'].includes(error.name);
  if (error.code === 11000) {
    return response.status(409).json({ message: 'An account with that email already exists.' });
  }
  if (!isClientError) console.error(error);
  return response.status(isClientError ? 400 : 500).json({
    message: isClientError ? error.message : 'Server error. Check logs and MongoDB connection.',
  });
}

async function startServer() {
  if (!process.env.ATLAS_URI) {
    throw new Error('ATLAS_URI is missing. Copy .env.example to .env and add your MongoDB URI.');
  }
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    throw new Error('SESSION_SECRET must be set to a random secret of at least 32 characters.');
  }

  await mongoose.connect(process.env.ATLAS_URI, { dbName: 'taskflow' });
  if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

  // Store session records in MongoDB and put only the opaque session ID in an HttpOnly cookie.
  app.use(session({
    name: 'taskflow.sid',
    secret: process.env.SESSION_SECRET,
    store: MongoStore.create({
      client: mongoose.connection.getClient(),
      dbName: 'taskflow',
      collectionName: 'sessions',
      ttl: sessionLifetimeMs / 1000,
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionLifetimeMs,
    },
  }));

  // Register API routes before the SPA fallback so /api requests never receive index.html.
  app.use('/api/auth', authRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api', (request, response) => {
    response.status(404).json({ message: 'API route not found.' });
  });
  app.use(express.static(buildDirectory));
  app.get('*path', (request, response) => {
    response.sendFile(path.join(buildDirectory, 'index.html'));
  });
  app.use(handleErrors);

  app.listen(port, () => console.log(`TaskFlow is running at http://localhost:${port}`));
}

startServer().catch((error) => {
  console.error(`TaskFlow could not start: ${error.message}`);
  process.exitCode = 1;
});
