import { useEffect, useMemo, useState } from 'react';
import TaskForm from './components/TaskForm.jsx';
import TaskSchedule from './components/TaskSchedule.jsx';
import TaskStats from './components/TaskStats.jsx';
import {
  fetchTasks,
  removeTask,
  saveTask,
  setTaskStatus,
} from './services/taskApi.js';
import { sortTasks, toDateInputValue } from './utils/tasks.js';

const EMPTY_FORM = {
  title: '',
  dueDate: '',
  priority: 'medium',
  status: 'planned',
};

/** Owns task data and coordinates the form, schedule, and API-backed actions. */
export default function App() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Load the initial schedule once, and cancel the request if this page unmounts.
  useEffect(() => {
    const controller = new AbortController();

    async function loadTasks() {
      try {
        const savedTasks = await fetchTasks(controller.signal);
        setTasks(sortTasks(savedTasks));
      } catch (requestError) {
        // A cancelled request is expected when React unmounts this page.
        if (requestError.name !== 'AbortError') setError(requestError.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadTasks();
    return () => controller.abort();
  }, []);

  const visibleTasks = useMemo(
    () => tasks.filter((task) => filter === 'all' || task.status === filter),
    [tasks, filter],
  );
  const plannedCount = tasks.filter((task) => task.status === 'planned').length;
  const completedCount = tasks.length - plannedCount;

  /** Keep controlled form state in sync with whichever field the user edits. */
  function handleFieldChange(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  /** Clear the form and leave edit mode after canceling or saving. */
  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  /** Create or update a task, then reflect the saved server record in the list. */
  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      // POST creates a task; PATCH updates the selected record using the same form.
      const savedTask = await saveTask(form, editingId);
      setTasks((currentTasks) => sortTasks(
        editingId
          ? currentTasks.map((task) => task._id === savedTask._id ? savedTask : task)
          : [...currentTasks, savedTask],
      ));
      resetForm();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  /** Copy a selected task into the form so it can be edited in place. */
  function handleEdit(task) {
    setEditingId(task._id);
    setForm({
      title: task.title,
      dueDate: toDateInputValue(task.dueDate),
      priority: task.priority,
      status: task.status,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /** Persist a completion-state change before updating the displayed task. */
  async function handleToggle(task) {
    try {
      const savedTask = await setTaskStatus(task);
      setTasks((currentTasks) => sortTasks(
        currentTasks.map((item) => item._id === savedTask._id ? savedTask : item),
      ));
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  /** Delete a task and clear the form if it was the task currently being edited. */
  async function handleRemove(task) {
    try {
      await removeTask(task._id);
      setTasks((currentTasks) => currentTasks.filter((item) => item._id !== task._id));
      if (editingId === task._id) resetForm();
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <main className="shell">
      <header>
        <a className="brand" href="#">◈ taskflow<span>.</span></a>
        <small>● &nbsp;Your work, in good order</small>
      </header>
      <section className="intro">
        <div>
          <p className="eyebrow">A little clarity goes a long way</p>
          <h1>Make room for<br /><em>what matters.</em></h1>
          <p className="lead">A thoughtful place for your next deadline, big idea, and everything in between.</p>
        </div>
        <aside>
          <small>TODAY</small>
          <b>{new Date().getDate()}</b>
          <span>{new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(new Date())}</span>
        </aside>
      </section>
      <TaskStats total={tasks.length} planned={plannedCount} completed={completedCount} />
      <div className="grid">
        <TaskForm
          form={form}
          editingId={editingId}
          saving={saving}
          onChange={handleFieldChange}
          onSubmit={handleSubmit}
          onCancel={resetForm}
        />
        <TaskSchedule
          tasks={tasks}
          visibleTasks={visibleTasks}
          filter={filter}
          loading={loading}
          error={error}
          onFilterChange={setFilter}
          onDismissError={() => setError('')}
          onToggle={handleToggle}
          onEdit={handleEdit}
          onRemove={handleRemove}
        />
      </div>
      <footer>
        <span>Made for the work that matters.</span>
        <span>Your schedule is saved automatically</span>
      </footer>
    </main>
  );
}
