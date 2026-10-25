# TaskFlow

TaskFlow is a single-page due-date scheduler. It persists tasks in MongoDB and supports create, read, edit, complete/reopen, delete, and status filters (All, Planned, Completed). The page shows loading, empty, saving, and request-error feedback.

## Technology

React 19 and Vite 8; Express 5; Mongoose 9; dotenv 18; MongoDB Atlas or another MongoDB host. Exact package versions are in package.json and package-lock.json.

## Project layout

```
taskflow/
├── docs/                 Architecture and beginner-friendly code guide
├── server/server.js      Task schema, API routes, startup, static hosting
└── src/
    ├── components/       Form, stats, schedule, and individual task card
    ├── services/         Browser requests to the task API
    ├── utils/             Date conversion, display, and due-date sorting
    ├── App.jsx            Shared page state and user-action handlers
    ├── index.css          Page design and responsive rules
    └── main.jsx           React entry point
```

## Architecture

`App.jsx` loads task records through `src/services/taskApi.js`, holds shared React state, and passes data and callbacks to focused display components. API calls return MongoDB documents; React updates its list only after successful writes. `src/utils/tasks.js` centralizes date conversion and due-date ordering. Express validates task data through the Mongoose `Task` model, connects to the `taskflow` database, and serves both `/api` and the built `dist/` app. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/CODE_GUIDE.md](docs/CODE_GUIDE.md).

## Database model

The Mongoose `Task` model stores title (required, trimmed, maximum 160 characters), dueDate (required), priority (`low`, `medium`, `high`; defaults to `medium`), status (`planned`, `completed`; defaults to `planned`), and created/updated timestamps. The database name is `taskflow`; Mongoose uses its `tasks` collection.

## API

| Method | Route | Purpose / response |
|---|---|---|
| GET | `/api/health` | API and database status |
| GET | `/api/tasks` | Task array ordered by due date |
| POST | `/api/tasks` | Create; returns saved task with 201 |
| PATCH | `/api/tasks/:id` | Update supported fields; returns task |
| DELETE | `/api/tasks/:id` | Delete; returns message and ID |

Validation and invalid ID errors return 400 JSON; missing records return 404; unexpected errors return a generic 500 response and are logged server-side.

## Authentication and integrations

There is no authentication, user ownership, AI, or voice integration in this project. The app is currently a local scheduler without account separation.

## Setup

Requirements: Node.js 20.19+ or 22.12+ and a MongoDB connection string.

1. Run `npm ci` in this folder.
2. Copy `.env.example` to `.env`; set `ATLAS_URI` to your private MongoDB URI. Keep `.env` private (it is gitignored).
3. Run `npm run build`, then `npm run server`.
4. Open http://localhost:3000. Check the database/API with `/api/health`.

For frontend hot reload, keep Express running and run `npm run dev` in a second terminal. Vite proxies `/api` to port 3000.

## Commands and checks

- `npm ci` installs the lockfile versions.
- `npm run dev` starts Vite.
- `npm run build` compiles the production frontend to `dist/`.
- `npm run server` starts Express after MongoDB connects.

No test or lint scripts are configured. There is no deployment manifest or CI pipeline. Production hosting needs a reachable MongoDB URI and `PORT` environment variable; Express serves `dist/` and the API together.

## Troubleshooting and limits

- **ATLAS_URI missing:** copy `.env.example` to `.env` and set a real URI.
- **MongoDB unavailable:** verify cluster status, database credentials, and Atlas IP access list.
- **Task list request fails:** confirm Express is running and `/api/health` responds with database connected.
- **Production page missing:** run `npm run build` before `npm run server`.
- No user accounts, per-user data isolation, pagination, automated tests, or deployment configuration are present.
