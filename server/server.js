import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const port = Number(process.env.PORT) || 3000;
const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const buildDirectory = path.resolve(serverDirectory, '../dist');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Add a task title.'],
    trim: true,
    maxlength: 160,
  },
  dueDate: { type: Date, required: [true, 'Choose a due date.'] },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['planned', 'completed'], default: 'planned' },
}, { timestamps: true });

const Task = mongoose.model('Task', taskSchema);
app.use(express.json({ limit: '20kb' }));

// Report whether the API is reachable and MongoDB is currently connected.
app.get('/api/health', (request, response) => {
  response.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Return the saved schedule in due-date order for initial page loading.
app.get('/api/tasks', async (request, response, next) => {
  try {
    const tasks = await Task.find({}).sort({ dueDate: 1, createdAt: 1 });
    response.json(tasks);
  } catch (error) {
    next(error);
  }
});

// Validate and persist a new task, returning its database-generated fields.
app.post('/api/tasks', async (request, response, next) => {
  try {
    const task = await Task.create(request.body);
    response.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

// Update only supported task fields and return the validated, updated document.
app.patch('/api/tasks/:id', async (request, response, next) => {
  try {
    // Keep PATCH limited to task fields so clients cannot modify IDs or timestamps.
    const allowedFields = ['title', 'dueDate', 'priority', 'status'];
    const updates = Object.fromEntries(
      Object.entries(request.body).filter(([field]) => allowedFields.includes(field)),
    );
    const task = await Task.findByIdAndUpdate(request.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!task) return response.status(404).json({ message: 'Task not found.' });
    return response.json(task);
  } catch (error) {
    return next(error);
  }
});

// Remove a task by ID and report a not-found response when it does not exist.
app.delete('/api/tasks/:id', async (request, response, next) => {
  try {
    const task = await Task.findByIdAndDelete(request.params.id);
    if (!task) return response.status(404).json({ message: 'Task not found.' });
    return response.json({ message: 'Task deleted.', id: task._id });
  } catch (error) {
    return next(error);
  }
});

// Keep unknown API paths JSON-shaped while Express serves the built React app for page routes.
app.use('/api', (request, response) => {
  response.status(404).json({ message: 'API route not found.' });
});
app.use(express.static(buildDirectory));
// Fall back to the single-page app for browser routes not handled by the API.
app.get('*path', (request, response) => {
  response.sendFile(path.join(buildDirectory, 'index.html'));
});

// Mongoose validation and invalid IDs are client errors; unexpected failures stay generic.
// Centralize API error responses so route handlers can forward failures with next().
app.use((error, request, response, next) => {
  if (response.headersSent) return next(error);
  const isClientError = ['ValidationError', 'CastError', 'SyntaxError'].includes(error.name);
  if (!isClientError) console.error(error);
  return response.status(isClientError ? 400 : 500).json({
    message: isClientError
      ? error.message
      : 'Server error. Check logs and MongoDB connection.',
  });
});

/** Connect to MongoDB before opening the HTTP listener so requests have a database. */
async function startServer() {
  if (!process.env.ATLAS_URI) {
    throw new Error('ATLAS_URI is missing. Copy .env.example to .env and add your MongoDB connection string.');
  }

  // Connect before accepting requests so the API never starts in a misleading disconnected state.
  await mongoose.connect(process.env.ATLAS_URI, { dbName: 'taskflow' });
  app.listen(port, () => {
    console.log(`TaskFlow is running at http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error(`TaskFlow could not start: ${error.message}`);
  process.exitCode = 1;
});
