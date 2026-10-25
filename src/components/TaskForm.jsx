/** Render the controlled create/edit form and delegate state changes to App. */
export default function TaskForm({
  form,
  editingId,
  saving,
  onChange,
  onSubmit,
  onCancel,
}) {
  return (
    <section className="panel">
      <p className="eyebrow">{editingId ? 'MAKE AN UPDATE' : 'START WITH ONE THING'}</p>
      <h2>{editingId ? 'Edit your task' : 'Add a task'}</h2>
      <form onSubmit={onSubmit}>
        <label className="wide">
          Task name
          <input
            name="title"
            value={form.title}
            onChange={onChange}
            placeholder="e.g. Prepare sprint demo"
            maxLength="160"
            required
          />
        </label>
        <label>
          Due date
          <input
            type="date"
            name="dueDate"
            value={form.dueDate}
            onChange={onChange}
            required
          />
        </label>
        <label>
          Priority
          <select name="priority" value={form.priority} onChange={onChange}>
            <option>low</option>
            <option>medium</option>
            <option>high</option>
          </select>
        </label>
        <label>
          Status
          <select name="status" value={form.status} onChange={onChange}>
            <option>planned</option>
            <option>completed</option>
          </select>
        </label>
        <div className="wide">
          <button className="primary" disabled={saving}>
            {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add to schedule'} ↗
          </button>
          {editingId && (
            <button type="button" className="cancel" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
