# 🚀 Create Express Backend CLI

[![npm version](https://img.shields.io/npm/v/create-express-backend-cli?color=blue)](https://www.npmjs.com/package/create-express-backend-cli)
[![npm downloads](https://img.shields.io/npm/dt/create-express-backend-cli?color=green)](https://www.npmjs.com/package/create-express-backend-cli)
[![license](https://img.shields.io/npm/l/create-express-backend-cli)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/efeurhobobullish/create-express-backend?style=social)](https://github.com/efeurhobobullish/create-express-backend)

A modern CLI tool to instantly generate a scalable **Express backend** with clean architecture, database setup, and production-ready structure.

---

## ⚡ Usage

```bash
npx create-express-backend-cli myApp
```

---

## 📂 Project Structure

```bash
myApp/
│
├── src/
│   ├── config/
│   │   └── connectDatabase.js
│   ├── controllers/
│   ├── middlewares/
│   │   └── globalError.js
│   ├── models/
│   ├── routes/
│   │   └── home.router.js
│   ├── services/
│   ├── utils/
│   ├── app.js
│   └── server.js
│
├── .env
├── .gitignore
├── package.json
└── README.md
```

---

## ⚙️ Features

```bash
✔ Instant Express backend setup
✔ Clean and scalable folder structure
✔ MongoDB / SQL database support
✔ Global error handling middleware
✔ Environment variable support
✔ Dev & production scripts
✔ Modular architecture (routes, controllers, services)
```

---

## 🛠️ Getting Started

```bash
cd myApp
npm install
npm run dev
```

---

## 🔑 Environment Variables

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
DATABASE_URL=
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

---

## 📌 Requirements

```bash
Node.js >= 14
npm or yarn
MongoDB (if using MongoDB option)
```

---

## 💡 Why use this?

This CLI removes repetitive backend setup so you can focus on building features instead of boilerplate.

---

## 👨‍💻 Author

Empire Tech Labs

---

## 📜 License

MIT
