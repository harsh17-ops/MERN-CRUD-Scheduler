import { formatDueDate } from '../utils/tasks.js';

/** Render one task with controls for completion, editing, and deletion. */
export default function TaskCard({ task, onToggle, onEdit, onRemove }) {
  const completed = task.status === 'completed';

  return (
    <article className={`task ${completed ? 'done' : ''}`} key={task._id}>
      <button
        className={`check ${completed ? 'checked' : ''}`}
        onClick={() => onToggle(task)}
        aria-label={completed ? `Reopen ${task.title}` : `Complete ${task.title}`}
      >
        {completed ? '✓' : ''}
      </button>
      <div className="task-main">
        <h3>{task.title}</h3>
        <p>
          {formatDueDate(task.dueDate)}
          <span className={`priority p-${task.priority}`}>
            ● {task.priority} priority
          </span>
        </p>
      </div>
      <span className={`status s-${task.status}`}>{task.status}</span>
      <button
        className="edit-action"
        aria-label={`Edit ${task.title}`}
        onClick={() => onEdit(task)}
      >
        Edit
      </button>
      <button aria-label={`Delete ${task.title}`} onClick={() => onRemove(task)}>×</button>
    </article>
  );
}
