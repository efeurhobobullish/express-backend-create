skip to:contentpackage search

Pro
Teams
Pricing
Documentation
npm
Search packages
Search
@codestackk/create-express-backend
1.0.3 • Public • Published 10 days ago
/@codestackk/create-express-backend/readme.md
/
@codestackk/create-express-backend
/
readme.md

Back
101 LOC
1.73 kB
# @codestackk/create-express-backend

🚀 CLI tool to quickly create a clean and scalable Express.js backend structure.

---

## ⚡ Usage

Run the CLI using **npx** (no installation required):

```bash
npx @codestackk/create-express-backend myApp
```

---

## 📂 What it creates

```
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

* Clean and scalable folder structure
* Express server setup
* MongoDB connection ready
* Global error handling middleware
* Environment configuration support
* Development & production scripts

---

## 🛠️ After project creation

```bash
cd myApp
npm install
npm run dev
```

---

## 🔑 Environment Variables

Update your `.env` file:

```
PORT=3000
MONGO_URI=your_mongodb_connection_string
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

---

## 📌 Notes

* Requires Node.js >= 14
* Uses nodemon for development
* Make sure MongoDB is running or provide a valid connection string

---

## 🧠 Why use this?

Setting up backend structure manually is repetitive and error-prone.
This CLI automates the setup so you can focus on building features instead of boilerplate.

---

## 👨‍💻 Author

Adarsh Gupta

---

## 📜 License

MIT