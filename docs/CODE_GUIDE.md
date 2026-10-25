# Code Guide

## Browser startup

`index.html` provides the root node. `src/main.jsx` mounts the App component and loads the CSS. Vite enables React JSX and proxies API requests during local development.

## Shared state and operations

`src/App.jsx` owns the task list, controlled form values, edit ID, filter, and loading/saving/error states. On first render, an effect loads records. Its AbortController cancels the request if the page unmounts. Submit chooses create or edit based on the selected ID. Edit copies a task to the form. Complete/reopen and delete handlers update React state only after the server confirms success.

## UI components

- `TaskForm.jsx`: renders controlled task fields and calls parent callbacks.
- `TaskStats.jsx`: displays total, planned, and completed counts.
- `TaskSchedule.jsx`: shows filters, request feedback, empty state, and task rows.
- `TaskCard.jsx`: shows one task and its complete, edit, and delete controls.

The components receive values and callback functions as props; API access stays in the parent/service.

## API service and utilities

`src/services/taskApi.js` contains one request function for each operation. It parses JSON and throws the server's error message when a response is unsuccessful. `src/utils/tasks.js` sorts a copied array (so React state is not mutated), formats dates for display, and converts stored dates for the browser date input.

## Server and database

`server/server.js` loads `.env`, defines the Mongoose Task schema, registers the health and CRUD routes, then connects to MongoDB before starting Express. The API writes/reads the `taskflow` database. Mongoose applies schema validation; Express error middleware formats expected validation/ID errors as 400 responses and unexpected errors as generic 500 responses.

## Run and verify

Copy `.env.example` to `.env`, configure ATLAS_URI, run `npm ci`, then `npm run build` and `npm run server`. The current package has no test or lint scripts. CRUD persistence requires a reachable MongoDB server.
