# Express Backend Create CLI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![NPM Version](https://img.shields.io/npm/v/express-backend-create.svg)](https://www.npmjs.com/package/express-backend-create)
[![NPM Downloads](https://img.shields.io/npm/dm/express-backend-create.svg)](https://www.npmjs.com/package/express-backend-create)



[![Download Now](https://img.shields.io/badge/Download-Latest-blue?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/express-backend-create)

A powerful CLI tool to scaffold Express.js backend applications with TypeScript support, best practices, and production-ready configurations.

## 📊 Package Statistics

| Metric | Value |
|--------|-------|
| 📦 Weekly Downloads | [![NPM Downloads](https://img.shields.io/npm/dw/express-backend-create.svg)](https://www.npmjs.com/package/express-backend-create) |
| 📈 Monthly Downloads | [![NPM Downloads](https://img.shields.io/npm/dm/express-backend-create.svg)](https://www.npmjs.com/package/express-backend-create) |
| 🎯 Total Downloads | [![NPM Total Downloads](https://img.shields.io/npm/dt/express-backend-create.svg)](https://www.npmjs.com/package/express-backend-create) |

---
**Express Backend Create CLI** is a robust, developer-first command-line tool designed for scaffolding production-ready Express.js applications instantly — just like `create-react-app` but for your Node.js backend.

```bash
npx express-backend-create my-app
```

No manual setup. No boilerplate hunting. Answer a few questions and your professional backend is running.

---

## Table of Contents

- [Quick Start](#quick-start)
- [CLI Experience](#cli-experience)
- [Supported Packages](#supported-packages)
- [What Gets Generated](#what-gets-generated)
- [Project Structure](#project-structure)
- [Feature Details](#feature-details)
- [Adding New Resources](#adding-new-resources)
- [Adding Cron Jobs](#adding-cron-jobs)
- [Error Handling](#error-handling)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Contributing](#contributing)
- [License](#license)

---

## Quick Start

**Requirements:** Node.js >= 18.0.0

```bash
# Recommended — pass project name directly
npx express-backend-create my-app

# Or run without a name for interactive guided setup
npx express-backend-create
```

The CLI will guide you through the configuration, then scaffold and install everything automatically:

```
────────────────────────────────────────────────────────────
  🚀  express-backend-creare
  Scaffold a production-ready Express.js backend instantly
────────────────────────────────────────────────────────────

  ? Project name:               my-app
  ? Select a language:          TypeScript (Recommended)
  ? Select a database:          MongoDB (Mongoose)
  ? Select features to include: Cron Jobs, Rate Limiting, CORS
  ? Default server port:        8080
```

### Next Steps

```bash
cd my-app
# fill in your .env values (MONGO_URI, etc.)
npm run dev             # start development server
```

---

## CLI Experience

The CLI is designed to be clear and informative at every step, using `@clack/prompts` for a modern terminal experience.

### Progress and Feedback

The engine provides real-time feedback during the scaffolding process:

```
⠋ Scaffolding project files...
✔ Project files created

⠋ Installing dependencies (this may take a minute)...
✔ Dependencies installed
```

### Success and Next Steps

```
  ✔  Success! Your project is ready at ./my-app

  🏁  Next Steps
────────────────────────────────────────────────────────────
  1.  cd my-app
  2.  npm run dev              ← start the development server
────────────────────────────────────────────────────────────

  Health check →  http://localhost:8080/
```

---

## Supported Packages

The CLI supports a curated selection of industry-standard packages, categorized for clarity:

### 🗄️ Databases (ORM/ODM)
| Package | Version | Purpose |
|---|---|---|
| `mongoose` | ^8.0.0 | MongoDB Object Modeling |
| `sequelize` | ^6.0.0 | SQL ORM (Postgres, MySQL, SQLite) |
| `pg` | ^8.0.0 | PostgreSQL Client |
| `mysql2` | ^3.0.0 | MySQL Client |
| `sqlite3` | ^5.0.0 | SQLite Client |

### 🛡️ Security & Middleware
| Package | Version | Purpose |
|---|---|---|
| `helmet` | ^7.0.0 | Secure HTTP Headers |
| `cors` | ^2.8.0 | Cross-Origin Resource Sharing |
| `express-rate-limit` | ^7.0.0 | Request Rate Limiting |
| `cookie-parser` | ^1.4.0 | Cookie Parsing |
| `morgan` | ^1.10.0 | HTTP Request Logging |

### ☁️ Cloud Services & Utils
| Package | Version | Purpose |
|---|---|---|
| `cron-guardian` | ^1.0.0 | Advanced Cron Job Orchestration |
| `@aws-sdk/client-s3` | ^3.0.0 | AWS S3 Storage |
| `cloudinary` | ^2.0.0 | Cloudinary Media Management |
| `nodemailer` | ^6.9.0 | SMTP Email Delivery |
| `zod` | ^3.0.0 | Type-safe Schema Validation |
| `joi` | ^17.0.0 | Schema Description & Validation |

---

## What Gets Generated

Every project includes a standardized set of files designed for scalability:

| File | Purpose |
|---|---|
| `src/index.[js\|ts]` | Main entry point — initializes DB, services, and starts the server. |
| `src/routes/user.routes.js` | Example domain routes with full CRUD implementation. |
| `src/controllers/user.controller.js`| Business logic handlers for the user resource. |
| `src/middlewares/errorHandler.js` | Global, standardized error response handler. |
| `src/middlewares/logger.js` | Custom request performance and telemetry logger. |
| `src/config/db.js` | Centralized database connection logic. |
| `.env.example` | Template for all required environment variables. |

---

## Project Structure

A typical project with MongoDB and all features:

```text
my-app/
├── src/
│   ├── index.[js|ts]               # Server entry point
│   ├── config/
│   │   └── db.[js|ts]               # Database connection logic
│   ├── controllers/
│   │   └── user.controller.[js|ts]  # User domain handlers
│   ├── middleware/
│   │   ├── errorHandler.[js|ts]     # Global error handling
│   │   └── logger.[js|ts]           # Request telemetry
│   ├── models/
│   │   └── mongoUser.[js|ts]        # Mongoose User model
│   ├── routes/
│   │   └── user.routes.[js|ts]      # User API endpoints
│   ├── services/
│   │   └── email.service.[js|ts]    # External service abstractions
│   └── jobs/
│       └── index.[js|ts]            # Cron job definitions
├── .env.example                     # Environment template
├── .gitignore
├── package.json
└── tsconfig.json                    # (TypeScript projects only)
```

---

## Feature Details

### Advanced Cron Jobs (`cron-guardian`)

The CLI integrates `cron-guardian` to provide a robust task scheduling system in `src/jobs/index.js`.

```javascript
import cronManager from './jobs/index.js';

// Features include:
// - Automatic retries on failure
// - Overlap prevention for long-running tasks
// - Execution logging and monitoring
```

### Resource Generator (`--crud`)

Generate entire API resources instantly from your existing models:

```bash
npx express-backend-create --crud Product
```
This will automatically generate:
- `src/controllers/product.controller.js`
- `src/routes/product.routes.js`
- Custom validation schemas (if Zod/Joi is selected)

---

## Adding New Resources

1.  **Define your Model**: Add a new schema in `src/models/`.
2.  **Generate CRUD**: Run the CLI with the `--crud` flag.
3.  **Mount Routes**: Register the new routes in `src/index.js`.

---

## Adding Cron Jobs

Scaffolding with the **Cron Jobs** feature creates a dedicated `src/jobs/` directory. You can add new jobs by calling `cronManager.schedule()` in `src/jobs/index.js`:

```javascript
cronManager.schedule(
  '0 0 * * *',           // Cron expression (every day at midnight)
  async () => {
    await performCleanup();
  },
  {
    name: 'daily-cleanup',
    retries: 3,            // Automatic retries on failure
    retryDelay: 5000,      // 5s delay between attempts
    preventOverlap: true,  // Skip if previous run is still active
    onFailure: (err, job) => {
      console.error(`${job.name} failed:`, err.message);
    }
  }
);
```

---

## Error Handling

All errors are funneled through the global error handler in `src/middlewares/errorHandler.js`. To trigger it, simply throw an error or pass it to `next()`:

```javascript
// In a controller
if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
}
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your specific credentials:

| Variable | Description |
|---|---|
| `PORT` | The port the HTTP server will listen on (default: `8080`). |
| `MONGODB_URL` | Connection string for MongoDB (if selected). |
| `SQL_DATABASE_URL`| Connection string for SQL databases (Postgres, MySQL, etc.). |
| `AWS_ACCESS_KEY_ID`| AWS credentials for S3 storage (if selected). |
| `CLOUDINARY_URL` | Cloudinary configuration URL (if selected). |

---

## Available Scripts

| Script | Command | Description |
|---|---|---|
| `npm run dev` | `tsx watch src/index.ts` | Starts the server with auto-restart on changes. |
| `npm start` | `node dist/index.js` | Starts the production-ready compiled server. |
| `npm run build`| `tsc` | Compiles TypeScript to JavaScript (TS projects only). |

---

## API Reference

### Health Check
```http
GET /
```
**Response (200 OK)**:
```json
{
  "message": "API is running"
}
```
Used to verify the server status and connectivity.

---

## Contributing

We welcome contributions to the Express Backend Create CLI!

1.  **Fork** the repository.
2.  **Create a feature branch**: `git checkout -b feature/amazing-feature`.
3.  **Commit your changes**: `git commit -m 'Add some amazing feature'`.
4.  **Push to the branch**: `git push origin feature/amazing-feature`.
5.  **Open a Pull Request**.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
