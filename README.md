# Health Connect Front‑end

A modern React + TypeScript single‑page application built with [Vite](https://vitejs.dev/).

This repository contains the patient‑facing frontend for *Health Connect*, a mock healthcare portal designed
for appointment management, treatment history, profile viewing, and more. All data is currently
served from in‑memory mocks; the app is intended as a design/proof‑of‑concept rather than a
production system.

---

## 🚀 Key Features

- **Authentication flows** – login / registration / password reset (patient or doctor roles).
- **Patient dashboard** with sidebar navigation and responsive design.
- **View and export treatment history** (PDF/Excel placeholder).
- **Book, view and manage appointments** with simple availability logic.
- **Unsuitable medicine list** and active medications.
- **Profile page** with editable avatar and read‑only personal/medical information.
- **Responsive layout** – desktop sidebar and mobile tab navigation.
- **Tailwind CSS for utility‑first styling.**
- **Full TypeScript support** with strict types defined in `src/types`.

## 🧱 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 (tsx) |
| Build tool | Vite 7 |
| Language | TypeScript 5.9 |
| Styling | Tailwind CSS (with `@tailwindcss/forms`) |
| Icons | lucide-react |
| Linter | ESLint (
  `@eslint/js`, `eslint-plugin-react-hooks` etc.) |
| Version control | Git (repository root is `health-connect-fe`) |

## 📂 Project Structure

```
health-connect-fe/
├── health-connect-frontend/        # actual SPA
│   ├── public/                     # static assets (favicons, robots.txt)
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── RegisterForm.tsx
│   │   │   │   └── ForgotPasswordForm.tsx
│   │   │   ├── patient/
│   │   │   │   ├── BookAppointmentView.tsx
│   │   │   │   ├── DashboardHome.tsx
│   │   │   │   ├── ProfileView.tsx
│   │   │   │   ├── TreatmentHistoryView.tsx
│   │   │   │   ├── UnsuitableMedicineView.tsx
│   │   │   │   └── Topbar.tsx
│   │   ├── data/
│   │   │   └── mockPatientData.ts
│   │   ├── hooks/
│   │   │   └── usePasswordStrength.ts
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   └── AuthPage.tsx
│   │   │   └── patient/
│   │   │       └── PatientDashboard.tsx
│   │   ├── routes/
│   │   │   └── AppRouter.tsx
│   │   ├── styles/
│   │   │   └── index.css
│   │   └── types/
│   │       ├── auth.types.ts
│   │       └── patient.types.ts
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── eslint.config.js
│   └── README.md                   # Vite template instructions
├── .gitignore
└── README.md                       # this file
```

The frontend lives under `health-connect-frontend/`. The outer folder primarily contains the
monorepo’s `.gitignore` and the root README.

## ⚙️ Getting Started

### Prerequisites

- **Node.js 18+** (LTS recommended)
- **npm** (bundled with Node) or **yarn/pnpm** of your choice

### Installation

```bash
cd health-connect-fe/health-connect-frontend
npm install
# or yarn
```

### Development

Start the Vite development server with hot reloading:

```bash
npm run dev
```

Then open <http://localhost:5173> in your browser. Changes you make in `src/` will be reflected
immediately.

### Building for Production

```bash
npm run build
```

The compiled assets will be generated in `dist/`. You may preview the production build using:

```bash
npm run preview
```

### Linting

Run ESLint across the codebase:

```bash
npm run lint
```

You can integrate this with a pre‑commit hook or your editor to keep the code clean.

## 🛠 Coding Notes

- **Routing** is minimal; `AppRouter` decides between auth and dashboard. React Router is imported
  but not currently used for URL‑based navigation.
- **Mocks** are stored in `src/data/mockPatientData.ts`. Replace with real API calls for production.
- **Password strength indicator** is implemented via `src/hooks/usePasswordStrength.ts` and used in
  registration/reset forms.
- **Styles** are utility‑first and responsive; Tailwind configuration lives in
  `tailwind.config.js`.

## 👩‍💻 Extending the App

1. Replace mock data with API services. Create a `services/` folder and use `fetch`/`axios`.
2. Add global state (e.g. React Context or Redux) if you need persistent user data.
3. Swap out icons or theming by editing components under `src/components`.
4. For doctor functionality, implement a dashboard path in `AppRouter` or use `react-router-dom`.

## 💡 Contribution

This repository is currently a standalone frontend sample. Feel free to fork, adapt or open an issue
if you’d like help integrating it with a backend or adding features.

1. Fork the repo and create a feature branch: `git checkout -b feat/my-new-view`.
2. Commit your changes with descriptive messages.
3. Open a pull request against `main`.

## 📄 License

This project is provided under the **MIT License**. See `LICENSE` at the repository root for details.

---

*Generated from source code analysis on March 11 2026.*
