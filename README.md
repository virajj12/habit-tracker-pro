# Habit Tracker Pro

A full-stack, gamified Habit Tracker application built for pioneers. Track your daily habits, manage categories, and analyze your progress with an intuitive and beautiful interface.

## 🚀 Features

- **Gamified Experience:** Engaging UI to keep you motivated.
- **Progress Tracking & Analytics:** Visualize your habit completion and streaks.
- **Custom Categories:** Organize your habits with personalized categories.
- **Flexible Scheduling:** Support for daily, range-based, and specific time scheduling.
- **Secure Authentication:** User registration, login, and password reset functionalities using JWT.
- **Progressive Web App (PWA):** Installable on your device for a native-like experience.

## 🛠️ Tech Stack

### Frontend
- **React 19:** Modern UI component library.
- **Vite:** Blazing fast frontend tooling.
- **Tailwind CSS:** Utility-first CSS framework for rapid styling.
- **Vite PWA:** For offline capabilities and installability.

### Backend
- **Serverless API:** Hosted endpoints inside the `/api` directory (designed for Vercel).
- **Node.js:** Server runtime.
- **MongoDB & Mongoose:** NoSQL database for flexible data modeling (User, Habit, HabitLog, Category).
- **JWT & Bcrypt:** Secure authentication and password hashing.
- **Nodemailer:** Email integration for password resets and notifications.

## 📁 Project Structure

```text
habit-tracker-advanced/
├── api/                  # Serverless API routes and Database models
│   ├── _models/          # Mongoose schemas (User, Habit, HabitLog, Category)
│   ├── _utils/           # API utilities and helpers
│   ├── analytics/        # Analytics endpoints
│   ├── auth/             # Authentication endpoints
│   ├── categories/       # Category management
│   ├── habit-logs/       # Habit tracking logs
│   └── habits/           # Habit CRUD operations
├── public/               # Static assets and PWA icons
├── src/                  # React Frontend Source Code
│   ├── assets/           # Images, SVGs, etc.
│   ├── components/       # Reusable React components (UI, Layout, Views)
│   ├── hooks/            # Custom React hooks
│   ├── App.jsx           # Main Application Component
│   ├── main.jsx          # Entry point
│   └── index.css         # Global Tailwind styles
├── vite.config.js        # Vite & PWA configuration
├── tailwind.config.js    # Tailwind theme configuration
└── package.json          # Project dependencies and scripts
```

## 💻 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Database (Local or Atlas)

### Installation

1. Clone the repository and navigate into the project directory.

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Ensure your `.env` or `.env.local` files contain the necessary variables for the backend (e.g., `MONGODB_URI`, `JWT_SECRET`, email credentials).

4. Start the development server:
   ```bash
   npm run dev
   ```
   *Note: If testing serverless functions locally, you may need to use `vercel dev` instead.*

## 📜 Available Scripts

- `npm run dev`: Starts the Vite development server.
- `npm run build`: Builds the frontend app for production.
- `npm run preview`: Locally previews the production build.
- `npm run lint`: Runs the Oxlint linter to find and fix issues in the code.
