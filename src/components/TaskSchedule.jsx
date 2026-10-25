import TaskCard from './TaskCard.jsx';

const FILTERS = ['all', 'planned', 'completed'];

/** Render task filters, request feedback, empty states, and the visible task cards. */
export default function TaskSchedule({
  tasks,
  visibleTasks,
  filter,
  loading,
  error,
  onFilterChange,
  onDismissError,
  onToggle,
  onEdit,
  onRemove,
}) {
  return (
    <section className="panel schedule">
      <div className="sched-head">
        <div>
          <p className="eyebrow">KEEP YOUR MOMENTUM</p>
          <h2>Your schedule <i>{visibleTasks.length}</i></h2>
        </div>
        <nav aria-label="Filter tasks">
          {FILTERS.map((status) => (
            <button
              key={status}
              className={filter === status ? 'active' : ''}
              aria-pressed={filter === status}
              onClick={() => onFilterChange(status)}
            >
              {status[0].toUpperCase() + status.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
          <button aria-label="Dismiss error" onClick={onDismissError}>×</button>
        </p>
      )}
      {loading && <p className="notice">Loading your schedule…</p>}
      {!loading && visibleTasks.length === 0 && (
        <div className="empty">
          <b>✳</b>
          <h3>{tasks.length ? `Nothing ${filter} right now.` : 'A clear page.'}</h3>
          <p>
            {tasks.length
              ? 'Try another filter to see the rest.'
              : 'Add your first task and give it a place in your day.'}
          </p>
        </div>
      )}
      <div>
        {visibleTasks.map((task) => (
          <TaskCard
            key={task._id}
            task={task}
            onToggle={onToggle}
            onEdit={onEdit}
            onRemove={onRemove}
          />
        ))}
      </div>
      {!loading && tasks.length > 0 && (
        <p className="footnote">✳ &nbsp;Small steps make meaningful progress.</p>
      )}
    </section>
  );
}
