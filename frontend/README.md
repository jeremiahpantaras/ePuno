# ePuno – Frontend

The web client for ePuno, a personal finance tracker. Built with **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS v4**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Language | TypeScript |
| Bundler | Vite |
| Styling | Tailwind CSS v4 |
| Auth | Firebase Auth (Google Sign-In) |
| Routing | React Router v7 |
| Icons | Lucide React |

---

## Project Structure

```
frontend/
├── public/
│   ├── manifest.json          # PWA web app manifest
│   └── ePunoFavivon.svg       # App icon
├── src/
│   ├── components/
│   │   ├── common/            # Reusable UI components
│   │   └── layout/            # AppLayout, bottom nav
│   ├── context/
│   │   ├── AuthContext.tsx    # Firebase auth state
│   │   └── ThemeContext.tsx   # Dark / Light / System theme
│   ├── hooks/
│   ├── pages/                 # Dashboard, Transactions, Goals, etc.
│   ├── services/              # API + Firebase service wrappers
│   ├── styles/
│   │   └── index.css          # Tailwind imports, CSS variables, dark mode
│   ├── types/
│   └── utils/
├── index.html
├── vite.config.ts
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_API_BASE_URL=http://localhost:5001
```

### 3. Start the development server

```bash
npm run dev
```

The app runs at `http://localhost:5173`.

---

## Features

- **Google Sign-In** — Firebase Auth, Google-only login
- **Dashboard** — Balance overview with glassmorphism UI
- **Transactions** — Add income/expenses with monthly limit enforcement
- **Analytics** — Spending breakdowns and trends
- **Goals** — Savings goal tracking
- **Dark / Light / System theme** — Persisted via `localStorage`
- **PWA** — "Add to Home Screen" install prompt (Android + iOS)

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

---

## Deployment

The app is deployed at:

- **Primary**: [epuno.cosedevs.com](https://epuno.cosedevs.com)
- **Vercel**: [epuno.vercel.app](https://epuno.vercel.app)
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
