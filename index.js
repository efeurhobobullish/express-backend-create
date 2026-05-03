#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const inquirer = require("inquirer");

// ================= INPUT =================
const projectName = process.argv[2];

if (!projectName) {
  console.log("❌ Please provide project name");
  process.exit(1);
}

if (!/^[a-zA-Z0-9-_]+$/.test(projectName)) {
  console.log("❌ Invalid project name");
  process.exit(1);
}

const projectPath = path.join(process.cwd(), projectName);

if (fs.existsSync(projectPath)) {
  console.log("❌ Folder already exists");
  process.exit(1);
}

// ================= PROMPTS =================
async function askOptions() {
  return inquirer.prompt([
    {
      type: "list",
      name: "database",
      message: "🗄️ Choose your Database:",
      choices: ["MongoDB", "PostgreSQL", "MySQL", "None"],
    },
    {
      type: "checkbox",
      name: "packages",
      message: "📦 Select packages to install:",
      choices: [
        { name: "Express", checked: true },
        { name: "Axios" },
        { name: "CORS", },
        { name: "Helmet" },
        { name: "Morgan" },
        { name: "Dotenv", checked: true },
        { name: "Mongoose" },
        { name: "Nodemon", checked: true },
      ],
    },
  ]);
}

// ================= DB =================
function dbTemplate(database) {
  if (database === "MongoDB") {
    return `
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully ✅");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

module.exports = connectDB;
`;
  }

  if (database === "PostgreSQL") {
    return `
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const connectDB = async () => {
  try {
    await pool.connect();
    console.log("PostgreSQL connected successfully ✅");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

module.exports = connectDB;
`;
  }

  if (database === "MySQL") {
    return `
const mysql = require("mysql2/promise");

const connectDB = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log("MySQL connected successfully ✅");
    return connection;
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

module.exports = connectDB;
`;
  }

  return `
const connectDB = async () => {
  console.log("No database selected");
};

module.exports = connectDB;
`;
}

// ================= PACKAGE.JSON (CUSTOM — NO npm init) =================
function createPackageJson(name) {
  return {
    name,
    version: "1.0.0",
    main: "src/index.js",
    type: "commonjs",
    scripts: {
      start: "node src/index.js",
      dev: "nodemon src/index.js",
    },
    license: "MIT",
  };
}

// ================= MAIN =================
async function main() {
  try {
    console.log(`
🚀 Creating project...
══════════════════════════════
📁 ${projectName}
══════════════════════════════
`);

    const config = await askOptions();

    fs.mkdirSync(projectPath);

    const folders = [
      "src",
      "src/config",
      "src/routes",
      "src/middlewares",
      "src/controllers",
      "src/models",
    ];

    folders.forEach((f) => {
      fs.mkdirSync(path.join(projectPath, f), { recursive: true });
    });

    // ================= INDEX =================
    const indexFile = `
const express = require("express");
const cors = require("cors");
${config.packages.includes("Axios") ? 'const axios = require("axios");' : ""}
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

${config.packages.includes("CORS") ? "app.use(cors());" : ""}

app.use("/", require("./routes/home"));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route Not Found" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
`;

    fs.writeFileSync(path.join(projectPath, "src/index.js"), indexFile);

    // ================= ROUTE =================
    fs.writeFileSync(
      path.join(projectPath, "src/routes/home.js"),
      `
const router = require("express").Router();

router.get("/", (req, res) => {
  res.send("API Running...");
});

module.exports = router;
`
    );

    // ================= DB =================
    fs.writeFileSync(
      path.join(projectPath, "src/config/db.js"),
      dbTemplate(config.database)
    );

    // ================= ENV =================
    fs.writeFileSync(
      path.join(projectPath, ".env"),
      `PORT=3000
MONGO_URI=
DATABASE_URL=
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=
`
    );

    fs.writeFileSync(
      path.join(projectPath, ".gitignore"),
      `node_modules
.env
`
    );

    // ================= PACKAGE.JSON =================
    fs.writeFileSync(
      path.join(projectPath, "package.json"),
      JSON.stringify(createPackageJson(projectName), null, 2)
    );

    // ================= INSTALL =================
    const deps = [];

    if (config.packages.includes("Express")) deps.push("express");
    if (config.packages.includes("Axios")) deps.push("axios");
    if (config.packages.includes("CORS")) deps.push("cors");
    if (config.packages.includes("Helmet")) deps.push("helmet");
    if (config.packages.includes("Morgan")) deps.push("morgan");
    if (config.packages.includes("Dotenv")) deps.push("dotenv");
    if (config.packages.includes("Mongoose")) deps.push("mongoose");

    console.log("\n📦 Installing dependencies...\n");

    execSync(`npm install ${deps.join(" ")}`, {
      cwd: projectPath,
      stdio: "inherit",
    });

    if (config.packages.includes("Nodemon")) {
      execSync("npm install -D nodemon", {
        cwd: projectPath,
        stdio: "inherit",
      });
    }

    // ================= SUCCESS UI =================
    console.log(`
🎉 Project Created Successfully!

📌 Next Steps:
──────────────────────────────
cd ${projectName}
npm install
npm run dev
──────────────────────────────
`);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

main();