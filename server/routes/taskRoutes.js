import { Router } from 'express';
import requireAuth from '../middleware/requireAuth.js';
import Task from '../models/Task.js';

const router = Router();

// Every task endpoint requires a session; route queries below additionally enforce ownership.
router.use(requireAuth);

router.get('/', async (request, response, next) => {
  try {
    // Scope reads to the current user and return tasks in schedule order.
    const tasks = await Task.find({ owner: request.session.userId }).sort({ dueDate: 1, createdAt: 1 });
    return response.json(tasks);
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (request, response, next) => {
  try {
    // The authenticated session, not a client-supplied owner field, determines task ownership.
    const { title, dueDate, priority, status } = request.body;
    const task = await Task.create({
      title,
      dueDate,
      priority,
      status,
      owner: request.session.userId,
    });
    return response.status(201).json(task);
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id', async (request, response, next) => {
  try {
    // Ignore fields outside the task's public editable shape, including owner.
    const allowedFields = ['title', 'dueDate', 'priority', 'status'];
    const updates = Object.fromEntries(
      Object.entries(request.body).filter(([field]) => allowedFields.includes(field)),
    );
    const task = await Task.findOneAndUpdate(
      // Combining ID and owner prevents changing another user's task by guessing its ID.
      { _id: request.params.id, owner: request.session.userId },
      updates,
      { new: true, runValidators: true },
    );
    if (!task) return response.status(404).json({ message: 'Task not found.' });
    return response.json(task);
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', async (request, response, next) => {
  try {
    const task = await Task.findOneAndDelete({
      // Use the same ownership constraint for deletion as for reads and updates.
      _id: request.params.id,
      owner: request.session.userId,
    });
    if (!task) return response.status(404).json({ message: 'Task not found.' });
    return response.json({ message: 'Task deleted.', id: task._id });
  } catch (error) {
    return next(error);
  }
});

export default router;
