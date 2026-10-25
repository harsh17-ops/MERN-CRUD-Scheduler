# Code Guide

## Authentication path

AuthPanel.jsx controls the email and password fields and switches between sign-in and registration. authApi.js sends same-origin JSON requests. authRoutes.js validates input, hashes new passwords, compares login passwords, regenerates the session ID, and saves userId in the server session. express-session manages the cookie; connect-mongo stores session data in MongoDB. App calls GET /api/auth/me on startup and displays either the scheduler or the auth form.

requireAuth.js protects task routes. The Task model and every task query use the session user ID. Password hashes are excluded from ordinary User model reads and never sent to React.

## CRUD path

TaskForm.jsx is controlled by state owned in App.jsx. Submit selects POST for create or PATCH for edit. TaskSchedule.jsx passes complete/reopen, edit, and delete callbacks to TaskCard.jsx. taskApi.js performs the HTTP calls. After success, App updates the task list from the server response; after failure it displays an error and leaves the existing record unchanged.

Express task routes use Mongoose for validation and persistence. Updates and deletes match both the task ID and owner, so a user cannot act on another user's task by guessing its ID.

## Main modules

- src/App.jsx: session check, state, and user-action orchestration.
- src/components: auth form, task form, counts, schedule, and one task card.
- src/services: HTTP requests and JSON error parsing.
- src/utils/tasks.js: date conversion, display, and copied-array sorting.
- server/server.js: configuration, Mongo connection, sessions, API mount order, and production hosting.
- server/routes: auth and task handlers.
- server/models: Mongoose field rules and ownership relation.
- server/middleware/requireAuth.js: login guard.
- server/scripts/assignLegacyTasks.js: optional migration for old ownerless records.

## Dates and errors

Date inputs use YYYY-MM-DD. Mongoose stores Date values; toDateInputValue prepares one for editing and formatDueDate keeps display dates stable across time zones. Sorting copies the array before ordering, preserving React's immutable state convention.

The auth API returns a generic invalid-login message. Server middleware maps bad input, duplicate account, unauthenticated, missing-resource, and unexpected failures to HTTP status codes. The browser shows returned messages in its feedback area.

## Run it

Copy .env.example to .env and set ATLAS_URI and SESSION_SECRET. Run npm ci, npm run build, and npm run server. For development, use npm run dev in another terminal. Ownerless records from before authentication require the explicit migration documented in README.
