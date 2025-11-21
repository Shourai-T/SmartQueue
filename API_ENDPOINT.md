# API Endpoints

Base URL: `http://127.0.0.1:8000` (or `http://localhost:8000`)
(Port set via `PORT` in `.env`, default 3000.)

**Note for Windows:** If `localhost` doesn't work, use `127.0.0.1` to force IPv4.

**CORS:** Allowed origins set via `FRONTEND_ORIGIN` env (default `http://localhost:3000`). Add your frontend URL (e.g., `http://localhost:5173` for Vite).

## Auth

### POST /auth/login

Authenticate user and return JWT.

- Body: `{ "username": string, "password": string }`
- Response: `{ "access_token": string }`
- Notes: Uses bcrypt password comparison. Token expires in `1d` (hardcoded).

## User

Prefix: `/user`

### POST /user

Create a new user (admin only).

- Guards: `AdminGuard` (requires JWT with role `admin`)
- Body: `CreateUserDto` -> `{ "username": string, "password": string, "role?": "admin" | "user" }`
- Response: Newly created user document (password hashed).

### GET /user

Return all users (currently stub string in code).

- Response (current): `"This action returns all user"`
- TODO: Replace with actual user list, excluding password.

### GET /user/:id

Return user by numeric id (currently stub string).

- Response (current): `"This action returns a #<id> user"`

### PATCH /user/:id

Update a user (currently stub).

- Body: `UpdateUserDto` (fields not defined in code snippet).

### DELETE /user/:id

Remove a user (currently stub).

## Queue

Prefix: `/queue`

### POST /queue

Create a new queue ticket.

- Body: `CreateQueueDto` -> `{ "source?": string }` (default `button`)
- Logic: Auto-increments `number` field. Sets `status` = `waiting`.
- Response: `{ message: string, queue: { _id, number, source, status, createdAt, updatedAt } }`

### PUT /queue/:id

Update queue ticket status.

- Body: `UpdateQueueStatusDto` -> `{ "status?": string }`
- Response: `{ message: string, queue: { ...updatedFields } }`

### POST /queue/next

Call next queue number (advances queue system).

- Body: none
- Response: Result from `callNextNumber()` logic

### GET /queue/current

Get current queue being served.

- Response: Current queue document or status

## Arduino / Hardware

Prefix: `/api`

### POST /api/button

Handle physical button press from Arduino.

- Body: `{ "status": string }`
- Response: `{ "ok": true }`
- Notes: Triggers `handleButtonPress()` in ArduinoService

### PUT /api/next

Trigger next queue call (alternative endpoint).

- Body: `{ "status": string }`
- Response: `{ "ok": true }`

## Root

### GET /

Return hello message from `AppService.getHello()`.

## Authentication / Security Notes

- JWT secret from `.env` `JWT_SECRET` or fallback `SECRET_KEY`.
- Expiration currently hardcoded to `1d`; `.env` has `JWT_EXPIRES_IN` not yet used.
- Only `POST /user` guarded by `AdminGuard`. Other user and queue routes are open; consider adding `JwtAuthGuard`.

## Suggested Improvements

- Add CORS: `app.enableCors({ origin: ["http://localhost:3000"], credentials: true });`
- Implement real `findAll()` in `UserService`: `return this.userModel.find().select('-password');`
- Guard queue routes if needed.
- Use `JwtModule.registerAsync` + `ConfigService` to consume `JWT_EXPIRES_IN`.

## Example Fetch (Frontend)

```js
// Login
const login = async (u, p) => {
  const r = await fetch("http://127.0.0.1:8000/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: u, password: p }),
  });
  const data = await r.json();
  return data.access_token;
};

// Create queue
const createQueue = async (token, source) => {
  const r = await fetch("http://127.0.0.1:8000/queue", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ source }),
  });
  return r.json();
};

// Call next queue
const callNext = async () => {
  const r = await fetch("http://127.0.0.1:8000/queue/next", {
    method: "POST",
  });
  return r.json();
};

// Get current queue
const getCurrentQueue = async () => {
  const r = await fetch("http://127.0.0.1:8000/queue/current");
  return r.json();
};
```

## Error Handling

- Queue creation increments sequentially; race conditions possible under heavy concurrency (consider transactions or optimistic locking if needed).
- Atlas connection issues typically due to IP whitelist / invalid credentials.

---

Generated on: 2025-11-19
