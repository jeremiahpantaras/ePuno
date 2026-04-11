# ePuno – Backend

REST API for the ePuno personal finance tracker. Built with **Node.js**, **Express**, **TypeScript**, and **Firebase Admin SDK**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 5 |
| Language | TypeScript |
| Auth | Firebase Admin SDK (JWT verification) |
| Database | Firebase Firestore |
| Dev runner | ts-node-dev |

---

## Project Structure

```
backend/
├── src/
│   ├── server.ts              # Entry point, Express setup, CORS
│   ├── config/
│   │   └── firebaseAdmin.ts   # Firebase Admin SDK initialization
│   ├── controllers/
│   │   └── budgetController.ts
│   ├── middleware/
│   │   └── authMiddleware.ts  # Firebase ID token verification
│   └── routes/
│       └── index.ts           # API route definitions
├── .env                       # Environment variables (not committed)
├── package.json
└── tsconfig.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project with Firestore enabled

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env` file in the `backend/` directory:

```env
PORT=5001
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

> **Never commit `.env` or the Firebase service account JSON key to version control.**

### 3. Start the development server

```bash
npm run dev
```

The server runs at `http://localhost:5001`.

---

## API Endpoints

All endpoints are prefixed with `/api` and require a valid Firebase ID token in the `Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/budget` | Get the current user's budget |
| `POST` | `/api/expense` | Add an expense transaction |
| `POST` | `/api/income` | Add an income transaction |
| `GET` | `/api/transactions` | List all transactions |
| `POST` | `/api/monthly-limit` | Set a monthly spending limit |
| `POST` | `/api/reset-budget` | Reset the current budget |
| `GET` | `/api/goals` | List all savings goals |
| `POST` | `/api/goals` | Add a savings goal |

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload (ts-node-dev) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |

---

## Security Notes

- Firebase ID tokens are verified on every protected request via `authMiddleware`.
- The Firebase service account key (`*-firebase-adminsdk-*.json`) is excluded from version control via `.gitignore`.
- CORS is configured to allow only requests from trusted origins.
