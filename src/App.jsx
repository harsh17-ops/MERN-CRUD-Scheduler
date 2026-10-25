import { useEffect, useMemo, useState } from 'react';
import AuthPanel from './components/AuthPanel.jsx';
import TaskForm from './components/TaskForm.jsx';
import TaskSchedule from './components/TaskSchedule.jsx';
import TaskStats from './components/TaskStats.jsx';
import { authenticate, fetchCurrentUser, signOut } from './services/authApi.js';
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

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetchCurrentUser()
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    async function loadTasks() {
      setLoading(true);
      try {
        const savedTasks = await fetchTasks(controller.signal);
        setTasks(sortTasks(savedTasks));
      } catch (requestError) {
        if (requestError.name !== 'AbortError') setError(requestError.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadTasks();
    return () => controller.abort();
  }, [user]);

  const visibleTasks = useMemo(
    () => tasks.filter((task) => filter === 'all' || task.status === filter),
    [tasks, filter],
  );
  const plannedCount = tasks.filter((task) => task.status === 'planned').length;
  const completedCount = tasks.length - plannedCount;

  async function handleAuthentication(email, password, mode) {
    const authenticatedUser = await authenticate(email, password, mode);
    setError('');
    setUser(authenticatedUser);
  }

  async function handleSignOut() {
    try {
      await signOut();
      setUser(null);
      setTasks([]);
      setError('');
      resetForm();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

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

  if (checkingSession) {
    return <main className="auth-shell"><p className="notice">Checking your session…</p></main>;
  }
  if (!user) {
    return <AuthPanel onAuthenticated={handleAuthentication} />;
  }

  return (
    <main className="shell">
      <header>
        <a className="brand" href="#">◈ taskflow<span>.</span></a>
        <div className="account-tools">
          <small>{user.email}</small>
          <button onClick={handleSignOut}>Sign out</button>
        </div>
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
