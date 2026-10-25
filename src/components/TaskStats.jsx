/** Present aggregate task counts supplied by the parent component. */
export default function TaskStats({ total, planned, completed }) {
  return (
    <section className="stats" aria-label="Task totals">
      <div><b>✳</b><strong>{total}</strong><small>Total tasks</small></div>
      <div><b className="gold">◷</b><strong>{planned}</strong><small>In progress</small></div>
      <div><b className="sage">✓</b><strong>{completed}</strong><small>Completed</small></div>
    </section>
  );
}
