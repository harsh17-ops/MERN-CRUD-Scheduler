/** Return a new task array ordered by due date without mutating React state. */
export function sortTasks(tasks) {
  return [...tasks].sort((first, second) => (
    new Date(first.dueDate) - new Date(second.dueDate)
  ));
}

/** Convert the stored date into the YYYY-MM-DD value required by input[type=date]. */
export function toDateInputValue(value) {
  // ISO slicing gives the date input its required format without locale-specific text.
  return new Date(value).toISOString().slice(0, 10);
}

/** Format a stored due date for the user's locale while keeping the day stable. */
export function formatDueDate(value) {
  // Dates are stored as timestamps; UTC avoids shifting the calendar day by local timezone.
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));
}
