# Solution

## Backend (Node.js)

### Async I/O

The original version of `items.js` was reading files with `fs.readFileSync`, which blocks the event loop.  
I replaced those calls with async helpers that use `fs.promises` instead:

- `readData()` – reads and parses `items.json` asynchronously
- `writeData(data)` – writes the file back asynchronously

All routes now use these helpers with `async/await` and proper `try/catch` error handling.  
This keeps the API responsive even when disk I/O is slow.

---

### `/api/stats` caching

`GET /api/stats` used to re-read and recalculate stats from disk every time.  
I added a small in-memory cache that stores the last computed result together with the file’s modification time (`mtimeMs`).

- If the file hasn’t changed, the cached result is reused.
- If the file was updated, stats are recomputed and the cache is refreshed.

It’s a simple optimization, but it removes redundant file reads while keeping results accurate.

---

### Testing (Jest)

I added Jest + Supertest tests for the items routes:

- **Normal cases**
    - `GET /api/items` returns all items or paginated results
    - `GET /api/items/:id` returns a matching item
    - `POST /api/items` adds a new one and writes to disk
- **Error cases**
    - Invalid ID → `400`
    - Missing item → `404`
    - Invalid input → `400`
    - Read or write failure → `500`

`fs.promises` is mocked so tests run fast and never touch the real filesystem.  
Everything runs cleanly via `npm test` in the backend folder.

---

### Notes

The cache is in-memory, which is fine for a single-process Node app.  
If this ran in multiple instances, it would need a shared cache or smarter invalidation (e.g., Redis, inotify, etc.).

---

## Frontend (React)

### Fixing the memory leak

The old `Items` component would try to update state after it unmounted.  
I fixed that by using an `AbortController` for each request:

- The controller’s `signal` is passed into `fetchItems`
- In `fetchItems`, state updates are skipped if the signal was aborted
- The effect cleanup calls `controller.abort()`

This removes the “setState on unmounted component” warning and makes the data layer safe.

---

### Pagination and search

On the client, `Items` now tracks:
- `search`
- `page`
- `pageSize`

Whenever one changes, it calls `fetchItems({ q, page, pageSize })`.

On the server, `GET /api/items`:
- Filters results by `q` (case-insensitive substring match on `name`)
- Applies pagination with `page` and `pageSize`
- Returns `{ items, meta }` or the raw array if pagination isn’t requested

The UI has a search box, next/previous buttons, and an input for “rows per page.”

---

### Virtualized list

To keep scrolling smooth with large data sets, I added `react-window`.  
Only the visible rows are rendered, which prevents React from choking on hundreds of DOM nodes.  
Tests mock this out with a simple `<ul>` renderer so that logic can still be verified easily.

---

### Add item dialog

I added a reusable `AddItemDialog` component that exercises the `POST /api/items` endpoint.  
It includes:

- Inputs for `name`, `category`, and `price`
- Basic validation (name required, price numeric)
- A disabled submit button while the request is in flight
- On success, it calls `onCreated`, which triggers a refresh in the `Items` list

If the request fails, an error message is shown inside the dialog.

---

### Detail page and error handling

The `ItemDetail` component fetches `/api/items/:id` and handles:

- `404` → shows “Item not found.”
- other errors → shows “Failed to load item. Please try again.”
- includes Back and Home buttons for navigation

This also uses an `AbortController` for safe unmounts.

---

### UI details

- All pages use Material UI components (`Box`, `Typography`, `Stack`, `Paper`, `Button`, etc.)
- Loading states show skeleton placeholders on first load
- Errors show as `Alert`s instead of silent failures
- Pagination summary text like “Showing 1–20 of 85 items” is displayed above the list

Overall, the app looks clean, consistent, and responsive.

---

## Testing

### Backend
Runs with Jest and Supertest, mocking `fs.promises`.  
Covers all routes, validation, and error handling.

### Frontend
Uses React Testing Library:

- **Items.test.js**
    - Loads list and verifies content
    - Checks search, pagination, and “rows per page”
    - Simulates adding an item
    - Handles API error state
- **ItemDetail.test.js**
    - Renders details for a valid item
    - 404 and 500 error states

All tests pass.

## Additional Work: StatsSummary Integration

To make the `/api/stats` endpoint visible from the UI, I added a small `StatsSummary` component on the frontend.

- Fetches data from `/api/stats` using the same async pattern as `fetchItems`.
- Displays:
    - **Total items** (count)
    - **Average price** (computed on the backend)
- Handles loading and error states gracefully.
- Uses an `AbortController` guard to prevent setting state after unmount.
- Integrated into the `Items` page just below the heading, providing a quick overview of dataset statistics.

**Why:**
This keeps the backend `/api/stats` route meaningful in the overall app flow and lets the user instantly verify aggregate data without running separate requests.
