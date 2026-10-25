# TaskFlow

TaskFlow is a private, full-stack deadline scheduler. Users create an account, sign in, and manage their own tasks. The app supports create, read, edit, complete/reopen, delete, and All/Planned/Completed filters.

## Stack

React 19, Vite 8, JavaScript ES modules, HTML, CSS, Node.js, Express 5, Mongoose 9, MongoDB, bcryptjs, express-session, and connect-mongo.

## Structure

- docs: architecture diagrams and assessment guide
- server/models: User and Task database schemas
- server/routes: authentication and task API handlers
- server/middleware: signed-in user guard
- server/scripts: explicit migration for tasks created before login existed
- src/components: authentication, task form, stats, schedule, task row
- src/services: browser HTTP requests
- src/utils: date conversion and sorting
- src/App.jsx: shared state and flow between components

## Architecture

React components render the page. App owns shared user/task/form state and calls API services. Express checks login sessions, validates requests with Mongoose, and reads/writes MongoDB. Task records are filtered by the signed-in user's ID. Express serves the Vite production build from the same origin as the API.

Read docs/ARCHITECTURE.md for HLD, system, data-flow, application-flow, and UX diagrams. Read docs/ASSESSMENT_GUIDE.md for a presentation walkthrough of React, HTML, CSS, JavaScript, Node, Express, REST, MongoDB, authentication, and CRUD. Read docs/CODE_GUIDE.md for a beginner-focused file walkthrough.

## Models

User stores a normalized unique email and a bcrypt password hash. The hash is excluded from ordinary reads and never returned to the browser.

Task stores title (required, trimmed, max 160 chars), dueDate (required), priority (low/medium/high), status (planned/completed), owner reference, and timestamps. An owner/dueDate index supports each user's chronological task list. MongoStore stores sessions in the taskflow database.

## API

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | /api/health | Public | API and database status |
| GET | /api/auth/me | Public | Current user or 401 |
| POST | /api/auth/register | Public | Create account and session |
| POST | /api/auth/login | Public | Verify credentials and create session |
| POST | /api/auth/logout | Signed in | Destroy session |
| GET | /api/tasks | Signed in | Read own tasks |
| POST | /api/tasks | Signed in | Create owned task |
| PATCH | /api/tasks/:id | Signed in | Edit own task or status |
| DELETE | /api/tasks/:id | Signed in | Delete own task |

Auth requests use JSON with email and password. The user response contains only ID and email. Login failures use a generic message. A task owned by another account looks like a missing task (404).

## Authentication

bcryptjs hashes passwords. express-session creates a server-side session; connect-mongo stores it in MongoDB. The browser receives only the opaque session ID in an HttpOnly, SameSite=Lax cookie. Task routes require a session and scope data access by its user ID. The cookie is Secure in production.

## Setup

Requirements: Node.js 20.19+ or 22.12+ and reachable MongoDB.

1. Run npm ci.
2. Copy .env.example to .env. Set ATLAS_URI and replace SESSION_SECRET with a private random value of at least 32 characters. Generate one with: node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
3. Run npm run build, then npm run server.
4. Open http://localhost:3000 and create an account.

For hot reload, run npm run dev in a second terminal; Vite proxies /api calls to Express on port 3000.

Existing tasks from the pre-auth app have no owner and are not exposed to any account. After deciding which account should own them, run npm run migrate:legacy -- account@example.com. Review or back up the database first. This migration is explicit and does not run automatically.

## Commands and limitations

npm ci installs pinned dependencies. npm run dev starts Vite. npm run build compiles to dist. npm run server starts Express. npm run migrate:legacy -- email@example.com assigns unowned tasks.

No test, lint, deployment, or CI scripts are configured. No email verification, password reset, login rate limiting, MFA, account deletion, or per-user export is included. Production use requires HTTPS, private ATLAS_URI and SESSION_SECRET values, and a reachable MongoDB.
