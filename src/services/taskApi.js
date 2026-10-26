const TASKS_URL = '/api/tasks';

/** Parse API JSON consistently and surface server validation messages in the UI. */
async function readResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Request failed.');
  }
  return data;
}

/** Retrieve all tasks and pass an optional signal through for request cancellation. */
export async function fetchTasks(signal) {
  const response = await fetch(TASKS_URL, { signal });
  return readResponse(response);
}

/** Create a task or update an existing one based on whether an edit ID is provided. */
export async function saveTask(task, editingId) {
  // Keep create and edit on one API helper so both return the saved server representation.
  const response = await fetch(editingId ? `${TASKS_URL}/${editingId}` : TASKS_URL, {
    method: editingId ? 'PATCH' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  return readResponse(response);
}

/** Toggle a task between planned and completed through the API. */
export async function setTaskStatus(task) {
  const nextStatus = task.status === 'completed' ? 'planned' : 'completed';
  const response = await fetch(`${TASKS_URL}/${task._id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: nextStatus }),
  });
  return readResponse(response);
}

/** Permanently remove the task identified by its database ID. */
export async function removeTask(taskId) {
  const response = await fetch(`${TASKS_URL}/${taskId}`, { method: 'DELETE' });
  return readResponse(response);
}
