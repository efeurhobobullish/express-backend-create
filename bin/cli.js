#!/usr/bin/env node
import { intro, outro, text, select, multiselect, confirm, spinner, note, cancel } from '@clack/prompts';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { execa } from 'execa';

// Check for --crud flag
const args = process.argv.slice(2);
const crudIndex = args.indexOf('--crud');
let crudModel = null;

if (crudIndex !== -1 && args[crudIndex + 1]) {
    crudModel = args[crudIndex + 1];
    await generateCRUD(crudModel);
    process.exit(0);
}

// Check for direct project creation (backend-setup foldername)
if (args.length === 1 && !args[0].startsWith('--')) {
    const projectName = args[0];
    await quickSetup(projectName);
    process.exit(0);
}

async function quickSetup(projectName) {
    intro(chalk.bgBlue.white(' 🚀 Backend Setup '));
    console.log(chalk.cyan('═'.repeat(60)));
    console.log(chalk.blue.bold(`📁 Creating project: ${chalk.underline(projectName)}`));
    console.log(chalk.cyan('═'.repeat(60)));

    // Add exit option at any time
    console.log(chalk.gray('💡 Press Ctrl+C anytime to exit'));
    console.log('');

    try {
        const language = await select({
            message: chalk.blue.bold('🔧 Choose your language:'),
            options: [
                { value: 'ts', label: chalk.green('● TypeScript') },
                { value: 'js', label: chalk.yellow('● JavaScript') },
            ],
        });

        const databases = await select({
            message: chalk.blue.bold('🗄️  Choose your Database:'),
            options: [
                { value: 'mongodb', label: chalk.green('🍃 MongoDB (Mongoose)') },
                { value: 'postgresql', label: chalk.blue('🐘 PostgreSQL') },
                { value: 'mysql', label: chalk.yellow('🐬 MySQL') },
                { value: 'sqlite', label: chalk.cyan('📦 SQLite') },
                { value: 'none', label: chalk.gray('❌ None') },
            ],
        });

        console.log(chalk.cyan('─'.repeat(60)));

        // Auto-select CORS and Helmet by default
        const middlewaresList = await multiselect({
            message: chalk.blue.bold('⚙️  Select the tools you want to include:'),
            options: [
                { value: 'cors', label: chalk.green('● CORS') + chalk.gray(' (Cross-Origin Resource Sharing)'), hint: 'Recommended' },
                { value: 'helmet', label: chalk.green('● Helmet') + chalk.gray(' (Security Headers)'), hint: 'Recommended' },
                { value: 'morgan', label: chalk.yellow('○ Morgan') + chalk.gray(' (HTTP Request Logger)'), hint: 'Optional' },
                { value: 'rateLimit', label: chalk.yellow('○ Rate Limit') + chalk.gray(' (API Rate Limiting)'), hint: 'Optional' },
                { value: 'cookieParser', label: chalk.yellow('○ Cookie Parser') + chalk.gray(' (Cookie Handling)'), hint: 'Optional' },
                { value: 'dotenv', label: chalk.green('● Dotenv') + chalk.gray(' (Environment Variables)'), hint: 'Recommended' },
                { value: 'nodemon', label: chalk.yellow('○ Nodemon') + chalk.gray(' (Auto-restart Dev)'), hint: 'Optional' },
                { value: 'zod', label: chalk.yellow('○ Zod') + chalk.gray(' (Schema Validation)'), hint: 'Optional' },
                { value: 'cron', label: chalk.yellow('○ Cron Jobs') + chalk.gray(' (cron-guardian)'), hint: 'Advanced' },
            ],
            required: false,
            initialValues: ['cors', 'helmet', 'dotenv'],
        });

        console.log(chalk.cyan('─'.repeat(60)));

        const storages = await select({
            message: chalk.blue.bold('📁 Where will you store media/files?'),
            options: [
                { value: 'local', label: chalk.green('💾 Local (Multer)') },
                { value: 's3', label: chalk.hex("#FFA500")('☁️  AWS S3') },
                { value: 'cloudinary', label: chalk.blue('🌤️  Cloudinary') },
                { value: 'firebase', label: chalk.yellow('🔥 Firebase Storage') },
                { value: 'uploadcare', label: chalk.cyan('⬆️  Uploadcare') },
                { value: 'mux', label: chalk.magenta('🎥 Mux (Video)') },
                { value: 'none', label: chalk.gray('❌ None') },
            ],
        });

        console.log(chalk.cyan('─'.repeat(60)));

        const emailService = await select({
            message: chalk.blue.bold('📧 Choose your Email Service:'),
            options: [
                { value: 'none', label: chalk.gray('❌ None') },
                { value: 'nodemailer', label: chalk.green('📮 Nodemailer (SMTP)') },
                { value: 'sendgrid', label: chalk.blue('📬 SendGrid') },
                { value: 'mailgun', label: chalk.hex("#FFA500")('🔫 Mailgun') },
                { value: 'brevo', label: chalk.cyan('📨 Brevo (formerly Sendinblue)') },
                { value: 'mailcheap', label: chalk.yellow('💰 Mailcheap') },
            ],
        });

        console.log(chalk.cyan('─'.repeat(60)));

        const port = await text({
            message: chalk.blue.bold('🌐 Select Port (default: 8080):'),
            placeholder: '8080',
            validate: (value) => {
                if (value && isNaN(Number(value))) return chalk.red('⚠️  Please enter a valid number');
            }
        });

        const finalPort = port || '8080';

        console.log(chalk.cyan('─'.repeat(60)));

        let summary =
            `${chalk.blue('📋 Project Summary')}\n${chalk.cyan('═'.repeat(40))}\n` +
            `📁 Directory:     ${chalk.white(projectName)}\n` +
            `🔧 Language:      ${chalk.white(language)}\n` +
            `🗄️  Database:      ${chalk.white(databases !== 'none' ? databases : 'none')}\n` +
            `⚙️  Middlewares:   ${chalk.white(middlewaresList.join(', ') || 'none')}\n` +
            `📁 Storage:       ${chalk.white(storages !== 'none' ? storages : 'none')}\n` +
            `📧 Email Service: ${chalk.white(emailService !== 'none' ? emailService : 'none')}\n` +
            `🌐 Port:          ${chalk.white(finalPort)}`;

        note(summary, chalk.blue.bold('📋 Summary of your selections'));

        const proceed = await confirm({
            message: chalk.blue.bold('✅ Does this look correct? Proceed with installation?'),
        });

        if (!proceed || typeof proceed !== 'boolean') {
            const exitConfirm = await confirm({
                message: chalk.yellow('⚠️  Are you sure you want to exit?'),
            });
            if (exitConfirm) {
                outro(chalk.yellow('👋 Setup cancelled by user.'));
                process.exit(0);
            } else {
                // Continue with setup
                return await quickSetup(projectName);
            }
        }

        const scaffoldOptions = {
            projectName,
            language,
            database: databases,
            middlewaresList,
            storage: storages,
            emailService,
            port: finalPort,
            targetDir: path.resolve(process.cwd(), projectName)
        };

        await scaffoldProject(scaffoldOptions);

        let nextSteps = `  cd ${projectName}\n`;
        nextSteps += `  npm run dev`;

        outro(`${chalk.green('✅ Project scaffolded successfully!')}
\n${chalk.cyan('═'.repeat(60))}
${chalk.bold('Next steps:')}
${chalk.cyan(nextSteps)}\n${chalk.cyan('═'.repeat(60))}
${chalk.dim('📦 Dependencies installed and Git initialized.')}`);
    } catch (error) {
        if (error instanceof Error && error.message === 'cancelled') {
            outro(chalk.yellow('👋 Setup cancelled by user.'));
        } else {
            outro(chalk.red('❌ An error occurred during setup.'));
            console.error(error);
        }
        process.exit(1);
    }
}

async function main() {
    intro(chalk.bgBlue.white(' 🚀 Backend Scaffolder CLI '));
    console.log(chalk.cyan('═'.repeat(60)));
    console.log(chalk.gray('💡 Press Ctrl+C anytime to exit'));
    console.log(chalk.cyan('═'.repeat(60)));

    const projectLocation = await select({
        message: chalk.blue.bold('📁 Where should we create the project?'),
        options: [
            { value: 'current', label: chalk.green('📂 Current Directory') },
            { value: 'new', label: chalk.blue('📁 New Directory') },
        ],
    });

    console.log(chalk.cyan('─'.repeat(60)));

    let projectName = '.';
    if (projectLocation === 'new') {
        const name = await text({
            message: 'Enter the directory name:',
            placeholder: 'my-backend',
            validate: (value) => {
                if (!value) return 'Please enter a name';
                if (fs.existsSync(value)) return 'Directory already exists';
            },
        });
        projectName = name;
    }

    const language = await select({
        message: 'Choose your language:',
        options: [
            { value: 'ts', label: 'TypeScript' },
            { value: 'js', label: 'JavaScript' },
        ],
    });

    const databases = await select({
        message: 'Choose your Database:',
        options: [
            { value: 'mongodb', label: 'MongoDB (Mongoose)' },
            { value: 'postgresql', label: 'PostgreSQL' },
            { value: 'mysql', label: 'MySQL' },
            { value: 'sqlite', label: 'SQLite' },
            { value: 'none', label: 'None' },
        ],
    });

    console.log(chalk.gray('─'.repeat(50)));

    const middlewaresList = await multiselect({
        message: chalk.blue.bold('⚙️  Select the tools you want to include:'),
        options: [
            { value: 'cors', label: chalk.green('● CORS') + chalk.gray(' (Cross-Origin Resource Sharing)'), hint: 'Recommended' },
            { value: 'helmet', label: chalk.green('● Helmet') + chalk.gray(' (Security Headers)'), hint: 'Recommended' },
            { value: 'morgan', label: chalk.yellow('○ Morgan') + chalk.gray(' (HTTP Request Logger)'), hint: 'Optional' },
            { value: 'rateLimit', label: chalk.yellow('○ Rate Limit') + chalk.gray(' (API Rate Limiting)'), hint: 'Optional' },
            { value: 'cookieParser', label: chalk.yellow('○ Cookie Parser') + chalk.gray(' (Cookie Handling)'), hint: 'Optional' },
            { value: 'dotenv', label: chalk.green('● Dotenv') + chalk.gray(' (Environment Variables)'), hint: 'Recommended' },
            { value: 'nodemon', label: chalk.yellow('○ Nodemon') + chalk.gray(' (Auto-restart Dev)'), hint: 'Optional' },
            { value: 'zod', label: chalk.yellow('○ Zod') + chalk.gray(' (Schema Validation)'), hint: 'Optional' },
            { value: 'cron', label: chalk.yellow('○ Cron Jobs') + chalk.gray(' (cron-guardian)'), hint: 'Advanced' },
        ],
        required: false,
        initialValues: ['cors', 'helmet', 'dotenv'],
    });

    console.log(chalk.gray('─'.repeat(50)));

    const storages = await select({
        message: 'Where will you store media/files?',
        options: [
            { value: 'local', label: 'Local (Multer)' },
            { value: 's3', label: 'AWS S3' },
            { value: 'cloudinary', label: 'Cloudinary' },
            { value: 'firebase', label: 'Firebase Storage' },
            { value: 'uploadcare', label: 'Uploadcare' },
            { value: 'mux', label: 'Mux (Video)' },
            { value: 'none', label: 'None' },
        ],
    });

    console.log(chalk.gray('─'.repeat(50)));

    const emailService = await select({
        message: 'Choose your Email Service:',
        options: [
            { value: 'none', label: 'None' },
            { value: 'nodemailer', label: 'Nodemailer (SMTP)' },
            { value: 'sendgrid', label: 'SendGrid' },
            { value: 'mailgun', label: 'Mailgun' },
            { value: 'brevo', label: 'Brevo (formerly Sendinblue)' },
            { value: 'mailcheap', label: 'Mailcheap' },
        ],
    });

    console.log(chalk.gray('─'.repeat(50)));

    const port = await text({
        message: 'Select Port (default: 8080):',
        placeholder: '8080',
        validate: (value) => {
            if (value && isNaN(Number(value))) return 'Please enter a valid number';
        }
    });

    const finalPort = port || '8080';

    console.log(chalk.gray('─'.repeat(50)));

    let summary =
        `Directory:     ${projectName}\n` +
        `Language:      ${language}\n` +
        `Database:      ${databases !== 'none' ? databases : 'none'}\n` +
        `Middlewares:   ${middlewaresList.join(', ') || 'none'}\n` +
        `Storage:       ${storages !== 'none' ? storages : 'none'}\n` +
        `Email Service: ${emailService !== 'none' ? emailService : 'none'}\n` +
        `Port:          ${finalPort}`;

    note(summary, 'Summary of your selections');

    const proceed = await confirm({
        message: 'Does this look correct? Proceed with installation?',
    });

    if (!proceed || typeof proceed !== 'boolean') {
        outro(chalk.yellow('Installation cancelled.'));
        process.exit(0);
    }

    const scaffoldOptions = {
        projectName,
        language,
        database: databases,
        middlewaresList,
        storage: storages,
        emailService,
        port: finalPort,
        targetDir: projectName === '.' ? process.cwd() : path.resolve(process.cwd(), projectName)
    };

    await scaffoldProject(scaffoldOptions);

    let nextSteps = '';
    if (projectName !== '.') {
        nextSteps += `  cd ${projectName}\n`;
    }
    nextSteps += `  npm run dev`;

    outro(`${chalk.green('✅ Project scaffolded successfully!')}
\n${chalk.gray('─'.repeat(50))}
${chalk.bold('Next steps:')}
${chalk.cyan(nextSteps)}\n${chalk.gray('─'.repeat(50))}
${chalk.dim('📦 Dependencies installed and Git initialized.')}`);
}

async function scaffoldProject(options) {
    const s = spinner();
    s.start('Scaffolding project structure...');

    const { targetDir } = options;

    if (options.projectName !== '.') {
        await fs.ensureDir(targetDir);
    }

    const folders = [
        'src/config',
        'src/controllers',
        'src/routes',
        'src/middlewares',
        'src/models',
        'src/services',
        'src/utils',
        'src/templates',
        'src/jobs',
    ];

    for (const folder of folders) {
        await fs.ensureDir(path.join(targetDir, folder));
    }

    await generateFiles(options, s);

    s.start('Installing dependencies...');
    try {
        await execa('npm', ['install'], { cwd: targetDir });
        s.stop('Dependencies installed.');
    } catch (error) {
        s.stop('Failed to install dependencies.');
    }

    s.start('Initializing Git...');
    try {
        await execa('git', ['init'], { cwd: targetDir });
        s.stop('Git initialized.');
    } catch (error) {
        s.stop('Failed to initialize Git.');
    }
}

async function generateFiles(options, s) {
    const { targetDir, language, database, storage, emailService, middlewaresList, port } = options;
    const ext = language === 'ts' ? 'ts' : 'js';
    const isTS = language === 'ts';

    s.message('Generating package.json...');
    const packageJson = {
        name: options.projectName === '.' ? path.basename(process.cwd()) : options.projectName,
        version: '1.0.0',
        main: `src/index.${ext}`,
        type: 'module',
        scripts: {
            start: `node src/index.${ext}`,
            dev: isTS ? 'tsx watch src/index.ts' : 'nodemon src/index.js'
        },
        dependencies: {
            express: '^4.18.2'
        },
        devDependencies: {}
    };

    if (isTS) {
        packageJson.devDependencies = {
            typescript: '^5.0.0',
            '@types/node': '^20.0.0',
            '@types/express': '^4.17.17',
            'tsx': '^4.0.0'
        };
        if (middlewaresList.includes('cors')) packageJson.devDependencies['@types/cors'] = '^2.8.13';
        if (middlewaresList.includes('morgan')) packageJson.devDependencies['@types/morgan'] = '^1.9.4';
        if (middlewaresList.includes('cookieParser')) packageJson.devDependencies['@types/cookie-parser'] = '^1.4.3';
    } else {
        packageJson.devDependencies.nodemon = '^3.0.0';
    }

    if (middlewaresList.includes('cors')) packageJson.dependencies.cors = '^2.8.5';
    if (middlewaresList.includes('helmet')) packageJson.dependencies.helmet = '^7.0.0';
    if (middlewaresList.includes('morgan')) packageJson.dependencies.morgan = '^1.10.0';
    if (middlewaresList.includes('rateLimit')) packageJson.dependencies['express-rate-limit'] = '^6.7.0';
    if (middlewaresList.includes('cookieParser')) packageJson.dependencies['cookie-parser'] = '^1.4.6';
    if (middlewaresList.includes('dotenv')) packageJson.dependencies.dotenv = '^16.3.1';
    if (middlewaresList.includes('zod')) packageJson.dependencies.zod = '^3.21.4';
    if (middlewaresList.includes('cron')) packageJson.dependencies['cron-guardian'] = '^1.0.0';

    if (database === 'mongodb') packageJson.dependencies.mongoose = '^7.4.0';
    if (['postgresql', 'mysql', 'sqlite'].includes(database)) {
        packageJson.dependencies.sequelize = '^6.32.1';
        if (database === 'postgresql') packageJson.dependencies.pg = '^8.11.1';
        if (database === 'mysql') packageJson.dependencies.mysql2 = '^3.5.0';
        if (database === 'sqlite') packageJson.dependencies.sqlite3 = '^5.1.6';
    }

    if (false) {
        // JWT authentication removed
    }

    if (storage === 'local') packageJson.dependencies.multer = '^1.4.5-lts.1';
    if (storage === 's3') packageJson.dependencies['@aws-sdk/client-s3'] = '^3.370.0';
    if (storage === 'cloudinary') packageJson.dependencies.cloudinary = '^1.37.3';
    if (storage === 'firebase') packageJson.dependencies['@firebase/storage'] = '^0.12.0';
    if (storage === 'uploadcare') packageJson.dependencies['@uploadcare/upload-client'] = '^6.0.0';
    if (storage === 'mux') packageJson.dependencies['@mux/mux-node'] = '^8.0.0';

    if (emailService === 'nodemailer') packageJson.dependencies.nodemailer = '^6.9.4';
    if (emailService === 'sendgrid') packageJson.dependencies['@sendgrid/mail'] = '^7.7.0';
    if (emailService === 'mailgun') packageJson.dependencies['mailgun.js'] = '^4.0.0';
    if (emailService === 'brevo') packageJson.dependencies['@getbrevo/brevo'] = '^2.0.0';
    if (emailService === 'mailcheap') packageJson.dependencies['nodemailer'] = '^6.9.4';

    await fs.writeJSON(path.join(targetDir, 'package.json'), packageJson, { spaces: 2 });

    if (isTS) {
        s.message('Generating tsconfig.json...');
        const tsconfig = {
            compilerOptions: {
                target: 'ESNext',
                module: 'ESNext',
                moduleResolution: 'node',
                esModuleInterop: true,
                forceConsistentCasingInFileNames: true,
                strict: true,
                skipLibCheck: true,
                outDir: './dist'
            },
            include: ['src/**/*']
        };
        await fs.writeJSON(path.join(targetDir, 'tsconfig.json'), tsconfig, { spaces: 2 });
    }

    s.message('Generating src/index...');
    let indexContent = `import express from 'express';
${middlewaresList.includes('dotenv') ? "import 'dotenv/config';" : ""}
${middlewaresList.includes('cors') ? "import cors from 'cors';" : ""}
${middlewaresList.includes('helmet') ? "import helmet from 'helmet';" : ""}
${middlewaresList.includes('morgan') ? "import morgan from 'morgan';" : ""}
${middlewaresList.includes('cookieParser') ? "import cookieParser from 'cookie-parser';" : ""}
import { errorHandler } from './middlewares/errorHandler.js';
import connectDB from './config/db.js';
import userRoutes from './routes/user.routes.js';
import { logger } from './middlewares/logger.js';
${middlewaresList.includes('cron') ? "import './jobs/index.js';" : ""}

const app = express();

connectDB();

${middlewaresList.includes('helmet') ? "app.use(helmet());" : ""}
${middlewaresList.includes('cors') ? "app.use(cors());" : ""}
${middlewaresList.includes('morgan') ? `app.use(morgan('dev'));` : ""}
app.use(logger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
${middlewaresList.includes('cookieParser') ? `app.use(cookieParser());` : ""}

app.get('/', (req${isTS ? ': any' : ''}, res${isTS ? ': any' : ''}) => {
    res.json({ message: 'API is running' });
});

app.use('/api/users', userRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || ${port};
app.listen(PORT, () => {
    console.log(\`Server running on port \${PORT}\`);
});
`;
    await fs.writeFile(path.join(targetDir, `src/index.${ext}`), indexContent);

    s.message('Generating middlewares/logger...');
    const loggerContent = `export const logger = (req${isTS ? ': any' : ''}, res${isTS ? ': any' : ''}, next${isTS ? ': any' : ''}) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const timestamp = new Date().toISOString();
        const method = req.method;
        const url = req.url;
        const status = res.statusCode;
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];
        console.log(\`[\${timestamp}] \${method} \${url} \${status} - \${duration}ms | IP: \${ip} | UA: \${userAgent}\`);
    });
    next();
};`;
    await fs.writeFile(path.join(targetDir, `src/middlewares/logger.${ext}`), loggerContent);

    s.message('Generating config/db...');
    let dbImports = '';
    let dbConnections = '';
    if (database === 'mongodb') {
        dbImports += "import mongoose from 'mongoose';\n";
        dbConnections += `    try {
        await mongoose.connect(process.env.MONGODB_URL${isTS ? ' as string' : ''});
        console.log('MongoDB Connected');
    } catch (err${isTS ? ': any' : ''}) {
        console.error('MongoDB Error:', err.message);
    }\n`;
    }
    if (['postgresql', 'mysql', 'sqlite'].includes(database)) {
        dbImports += "import { Sequelize } from 'sequelize';\n";
        dbConnections += `    const sequelize = new Sequelize(process.env.SQL_DATABASE_URL${isTS ? ' as string' : ''});
    try {
        await sequelize.authenticate();
        console.log('SQL Database Connected');
    } catch (err${isTS ? ': any' : ''}) {
        console.error('SQL Error:', err.message);
    }\n`;
    }

    const dbConfigContent = `${dbImports}
const connectDB = async () => {
${dbConnections}
};
export default connectDB;`;
    await fs.writeFile(path.join(targetDir, `src/config/db.${ext}`), dbConfigContent);

    if (middlewaresList.includes('cron')) {
        s.message('Generating src/jobs...');
        const cronTemplate = `import { SmartCron } from 'cron-guardian';

const cronManager = new SmartCron();

// Schedule an example job
cronManager.schedule('*/5 * * * *', async () => {
    console.log('Cron Job: Runs every 5 minutes');
}, {
    name: 'example-job',
    retries: 3,
    retryDelay: 5000,
    preventOverlap: true,
    onFailure: (error${isTS ? ': any' : ''}, job${isTS ? ': any' : ''}) => {
        console.error(\`Job \${job.name} failed:\`, error.message);
    }
});

export default cronManager;`;

        await fs.writeFile(path.join(targetDir, `src/jobs/index.${ext}`), cronTemplate);
    }

    if (database === 'mongodb') {
        s.message('Generating models/User (Mongo)...');
        const userModelContent = `import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
}, { timestamps: true });
export const MongoUser = mongoose.model('User', userSchema);`;
        await fs.writeFile(path.join(targetDir, `src/models/mongoUser.${ext}`), userModelContent);
    }

    s.message('Generating middlewares/errorHandler...');
    const errorHandlerContent = `export const errorHandler = (err${isTS ? ': any' : ''}, req${isTS ? ': any' : ''}, res${isTS ? ': any' : ''}, next${isTS ? ': any' : ''}) => {
    const status = err.status || 500;
    res.status(status).json({
        error: {
            message: err.message || 'Internal Server Error',
            status: status
        }
    });
};`;
    await fs.writeFile(path.join(targetDir, `src/middlewares/errorHandler.${ext}`), errorHandlerContent);

    s.message('Generating User CRUD controllers...');
    const userControllerContent = `import { logger } from '../middlewares/logger.js';
${database === 'mongodb' ? "import { MongoUser } from '../models/mongoUser.js';" : ""}

export const getUsers = async (req${isTS ? ': any' : ''}, res${isTS ? ': any' : ''}) => {
    try {
        ${database === 'mongodb' ? "const users = await MongoUser.find();" : "const users = [];"}
        res.json(users);
    } catch (err${isTS ? ': any' : ''}) {
        res.status(500).json({ message: err.message });
    }
};

export const register = async (req${isTS ? ': any' : ''}, res${isTS ? ': any' : ''}) => {
    try {
        const { name, email, password } = req.body;
        ${database === 'mongodb' ? "const user = await MongoUser.create({ name, email, password });" : "const user = { name, email, password };"}
        res.status(201).json(user);
    } catch (err${isTS ? ': any' : ''}) {
        res.status(400).json({ message: err.message });
    }
};

export const login = async (req${isTS ? ': any' : ''}, res${isTS ? ': any' : ''}) => {
    try {
        const { email, password } = req.body;
        ${database === 'mongodb' ? "const user = await MongoUser.findOne({ email });" : "const user = null;"}
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ user });
    } catch (err${isTS ? ': any' : ''}) {
        res.status(500).json({ message: err.message });
    }
};

export const updateProfile = async (req${isTS ? ': any' : ''}, res${isTS ? ': any' : ''}) => {
    try {
        const { name } = req.body;
        ${database === 'mongodb' ? "const user = await MongoUser.findByIdAndUpdate(req.params.id, { name }, { new: true });" : "const user = { name };"}
        res.json(user);
    } catch (err${isTS ? ': any' : ''}) {
        res.status(500).json({ message: err.message });
    }
};

export const deleteUser = async (req${isTS ? ': any' : ''}, res${isTS ? ': any' : ''}) => {
    try {
        ${database === 'mongodb' ? "await MongoUser.findByIdAndDelete(req.params.id);" : ""}
        res.json({ message: 'User deleted' });
    } catch (err${isTS ? ': any' : ''}) {
        res.status(500).json({ message: err.message });
    }
};`;
    await fs.writeFile(path.join(targetDir, `src/controllers/user.controller.${ext}`), userControllerContent);

    const userRoutesContent = `import express from 'express';
import { getUsers, register, login, updateProfile, deleteUser } from '../controllers/user.controller.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/', getUsers);
router.put('/profile', updateProfile);
router.delete('/:id', deleteUser);

export default router;`;
    await fs.writeFile(path.join(targetDir, `src/routes/user.routes.${ext}`), userRoutesContent);

    if (storage === 'local') {
        s.message('Generating upload service...');
        await fs.ensureDir(path.join(targetDir, 'uploads'));
        const uploadContent = `import multer from 'multer';
import path from 'path';
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
export const upload = multer({ storage });`;
        await fs.writeFile(path.join(targetDir, `src/services/upload.service.${ext}`), uploadContent);
    }

    if (storage === 's3') {
        const s3ServiceContent = `import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
const s3 = new S3Client({
    region: process.env.AWS_REGION${isTS ? ' as string' : ''},
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID${isTS ? ' as string' : ''},
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY${isTS ? ' as string' : ''}
    }
});
export const uploadToS3 = async (file: any) => {
    const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME${isTS ? ' as string' : ''},
        Key: \`uploads/\${Date.now()}-\${file.originalname}\`,
        Body: file.buffer
    });
    return s3.send(command);
};`;
        await fs.writeFile(path.join(targetDir, `src/services/s3.service.${ext}`), s3ServiceContent);
    }

    if (storage === 'cloudinary') {
        const cloudinaryServiceContent = `import { v2 as cloudinary } from 'cloudinary';
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME${isTS ? ' as string' : ''},
    api_key: process.env.CLOUDINARY_API_KEY${isTS ? ' as string' : ''},
    api_secret: process.env.CLOUDINARY_API_SECRET${isTS ? ' as string' : ''}
});
export const uploadToCloudinary = (filePath: string) => cloudinary.uploader.upload(filePath);`;
        await fs.writeFile(path.join(targetDir, `src/services/cloudinary.service.${ext}`), cloudinaryServiceContent);
    }

    if (storage === 'firebase') {
        const firebaseServiceContent = `import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY${isTS ? ' as string' : ''},
    authDomain: process.env.FIREBASE_AUTH_DOMAIN${isTS ? ' as string' : ''},
    projectId: process.env.FIREBASE_PROJECT_ID${isTS ? ' as string' : ''},
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET${isTS ? ' as string' : ''},
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID${isTS ? ' as string' : ''},
    appId: process.env.FIREBASE_APP_ID${isTS ? ' as string' : ''}
};
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
export const uploadToFirebase = async (file: any, filename: string) => {
    const storageRef = ref(storage, \`uploads/\${filename}\`);
    return uploadBytes(storageRef, file.buffer);
};`;
        await fs.writeFile(path.join(targetDir, `src/services/firebase.service.${ext}`), firebaseServiceContent);
    }

    if (storage === 'uploadcare') {
        const uploadcareServiceContent = `import { UploadcareClient } from '@uploadcare/upload-client';
const client = new UploadcareClient({
    publicKey: process.env.UPLOADCARE_PUBLIC_KEY${isTS ? ' as string' : ''}
});
export const uploadToUploadcare = async (file: any) => {
    return client.uploadFile(file.buffer, {
        fileName: file.originalname,
        contentType: file.mimetype
    });
};`;
        await fs.writeFile(path.join(targetDir, `src/services/uploadcare.service.${ext}`), uploadcareServiceContent);
    }

    if (storage === 'mux') {
        const muxServiceContent = `import { Mux } from '@mux/mux-node';
const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID${isTS ? ' as string' : ''},
    tokenSecret: process.env.MUX_TOKEN_SECRET${isTS ? ' as string' : ''}
});
export const uploadToMux = async (url: string) => {
    return mux.video.uploads.create({
        url: url,
        new_asset_settings: {
            playback_policy: 'public'
        }
    });
};`;
        await fs.writeFile(path.join(targetDir, `src/services/mux.service.${ext}`), muxServiceContent);
    }

    if (emailService !== 'none') {
        if (emailService === 'nodemailer') {
            const emailContent = `import nodemailer from 'nodemailer';
export const sendEmail = async (to${isTS ? ': string' : ''}, subject${isTS ? ': string' : ''}, html${isTS ? ': string' : ''}) => {
    const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST${isTS ? ' as string' : ''},
        port: Number(process.env.MAIL_PORT),
        auth: { user: process.env.MAIL_USER${isTS ? ' as string' : ''}, pass: process.env.MAIL_PASS${isTS ? ' as string' : ''} }
    });
    await transporter.sendMail({
        from: process.env.MAIL_FROM${isTS ? ' as string' : ''},
        to,
        subject,
        html
    });
};`;
            await fs.writeFile(path.join(targetDir, `src/services/email.service.${ext}`), emailContent);
        }

        if (emailService === 'sendgrid') {
            const sendgridContent = `import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY${isTS ? ' as string' : ''});
export const sendEmail = async (to${isTS ? ': string' : ''}, subject${isTS ? ': string' : ''}, html${isTS ? ': string' : ''}) => {
    const msg = {
        to,
        from: process.env.SENDGRID_FROM_EMAIL${isTS ? ' as string' : ''},
        subject,
        html
    };
    await sgMail.send(msg);
};`;
            await fs.writeFile(path.join(targetDir, `src/services/email.service.${ext}`), sendgridContent);
        }

        if (emailService === 'mailgun') {
            const mailgunContent = `import formData from 'form-data';
import Mailgun from 'mailgun.js';
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY${isTS ? ' as string' : ''}
});
export const sendEmail = async (to${isTS ? ': string' : ''}, subject${isTS ? ': string' : ''}, html${isTS ? ': string' : ''}) => {
    const data = {
        from: process.env.MAILGUN_FROM_EMAIL${isTS ? ' as string' : ''},
        to,
        subject,
        html
    };
    return mg.messages.create(process.env.MAILGUN_DOMAIN${isTS ? ' as string' : ''}, data);
};`;
            await fs.writeFile(path.join(targetDir, `src/services/email.service.${ext}`), mailgunContent);
        }

        if (emailService === 'brevo') {
            const brevoContent = `import brevo from '@getbrevo/brevo';
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
    brevo.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY${isTS ? ' as string' : ''}
);
export const sendEmail = async (to${isTS ? ': string' : ''}, subject${isTS ? ': string' : ''}, html${isTS ? ': string' : ''}) => {
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;
    sendSmtpEmail.sender = { email: process.env.BREVO_FROM_EMAIL${isTS ? ' as string' : ''} };
    sendSmtpEmail.to = [{ email: to }];
    return apiInstance.sendTransacEmail(sendSmtpEmail);
};`;
            await fs.writeFile(path.join(targetDir, `src/services/email.service.${ext}`), brevoContent);
        }

        if (emailService === 'mailcheap') {
            const mailcheapContent = `import nodemailer from 'nodemailer';
export const sendEmail = async (to${isTS ? ': string' : ''}, subject${isTS ? ': string' : ''}, html${isTS ? ': string' : ''}) => {
    const transporter = nodemailer.createTransport({
        host: process.env.MAILCHEAP_HOST${isTS ? ' as string' : ''},
        port: Number(process.env.MAILCHEAP_PORT),
        auth: { 
            user: process.env.MAILCHEAP_USER${isTS ? ' as string' : ''}, 
            pass: process.env.MAILCHEAP_PASS${isTS ? ' as string' : ''}
        }
    });
    await transporter.sendMail({
        from: process.env.MAILCHEAP_FROM${isTS ? ' as string' : ''},
        to,
        subject,
        html
    });
};`;
            await fs.writeFile(path.join(targetDir, `src/services/email.service.${ext}`), mailcheapContent);
        }
    }

    s.message('Generating .env...');
    let envLines = [`PORT=${port}`];
    if (database === 'mongodb') envLines.push('MONGODB_URL=mongodb://localhost:27017/mydb');
    if (['postgresql', 'mysql', 'sqlite'].includes(database)) envLines.push('SQL_DATABASE_URL=postgres://user:pass@localhost:5432/mydb');
    if (storage === 's3') {
        envLines.push('AWS_REGION=us-east-1');
        envLines.push('AWS_ACCESS_KEY_ID=your_access_key');
        envLines.push('AWS_SECRET_ACCESS_KEY=your_secret_key');
        envLines.push('AWS_BUCKET_NAME=your_bucket_name');
    }
    if (storage === 'cloudinary') {
        envLines.push('CLOUDINARY_CLOUD_NAME=your_cloud_name');
        envLines.push('CLOUDINARY_API_KEY=your_api_key');
        envLines.push('CLOUDINARY_API_SECRET=your_api_secret');
    }
    if (storage === 'firebase') {
        envLines.push('FIREBASE_API_KEY=your_firebase_api_key');
        envLines.push('FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com');
        envLines.push('FIREBASE_PROJECT_ID=your_project_id');
        envLines.push('FIREBASE_STORAGE_BUCKET=your_project.appspot.com');
        envLines.push('FIREBASE_MESSAGING_SENDER_ID=123456789');
        envLines.push('FIREBASE_APP_ID=1:123456789:web:abcdef');
    }
    if (storage === 'uploadcare') {
        envLines.push('UPLOADCARE_PUBLIC_KEY=your_uploadcare_public_key');
    }
    if (storage === 'mux') {
        envLines.push('MUX_TOKEN_ID=your_mux_token_id');
        envLines.push('MUX_TOKEN_SECRET=your_mux_token_secret');
    }
    if (emailService === 'nodemailer') {
        envLines.push('MAIL_HOST=smtp.example.com');
        envLines.push('MAIL_PORT=587');
        envLines.push('MAIL_USER=your_email@example.com');
        envLines.push('MAIL_PASS=your_password');
        envLines.push('MAIL_FROM="Your App" <noreply@example.com>');
    }
    if (emailService === 'sendgrid') {
        envLines.push('SENDGRID_API_KEY=your_sendgrid_api_key');
        envLines.push('SENDGRID_FROM_EMAIL=noreply@example.com');
    }
    if (emailService === 'mailgun') {
        envLines.push('MAILGUN_API_KEY=your_mailgun_api_key');
        envLines.push('MAILGUN_DOMAIN=mg.example.com');
        envLines.push('MAILGUN_FROM_EMAIL=noreply@example.com');
    }
    if (emailService === 'brevo') {
        envLines.push('BREVO_API_KEY=your_brevo_api_key');
        envLines.push('BREVO_FROM_EMAIL=noreply@example.com');
    }
    if (emailService === 'mailcheap') {
        envLines.push('MAILCHEAP_HOST=smtp.mailcheap.co');
        envLines.push('MAILCHEAP_PORT=587');
        envLines.push('MAILCHEAP_USER=your_email@example.com');
        envLines.push('MAILCHEAP_PASS=your_password');
        envLines.push('MAILCHEAP_FROM="Your App" <noreply@example.com>');
    }

    const envContent = envLines.join('\n') + '\n';
    await fs.writeFile(path.join(targetDir, '.env'), envContent);
    await fs.writeFile(path.join(targetDir, '.env.example'), envContent);

    const gitignoreContent = `node_modules\n.env\nuploads\n`;
    await fs.writeFile(path.join(targetDir, '.gitignore'), gitignoreContent);

    s.stop('Files generated.');
}

async function generateCRUD(modelName) {
    intro(chalk.bgMagenta.black(` CRUD Generator for ${modelName} `));

    const s = spinner();

    // Check if we're in a valid project directory
    if (!fs.existsSync('src') || !fs.existsSync('src/models')) {
        outro(chalk.red('Error: Not in a valid backend project directory. Make sure you have src/models folder.'));
        process.exit(1);
    }

    // Detect TypeScript or JavaScript
    const isTS = fs.existsSync('tsconfig.json') || fs.existsSync('src/models') &&
        fs.readdirSync('src/models').some(f => f.endsWith('.ts'));
    const ext = isTS ? 'ts' : 'js';

    s.start(`Looking for ${modelName} model...`);

    // Look for the model file
    const modelPath = path.join('src', 'models', `${modelName}.${ext}`);
    const modelPathAlt = path.join('src', 'models', `${modelName}.model.${ext}`);
    const modelPathSchema = path.join('src', 'models', `${modelName}.schema.${ext}`);

    let finalModelPath = null;
    if (fs.existsSync(modelPath)) finalModelPath = modelPath;
    else if (fs.existsSync(modelPathAlt)) finalModelPath = modelPathAlt;
    else if (fs.existsSync(modelPathSchema)) finalModelPath = modelPathSchema;

    if (!finalModelPath) {
        s.stop('Model not found');
        outro(chalk.red(`Error: Model file for "${modelName}" not found in src/models/`));
        process.exit(1);
    }

    s.stop('Model found');

    // Read and analyze the model
    const modelContent = await fs.readFile(finalModelPath, 'utf-8');
    const schemaFields = extractSchemaFields(modelContent);

    s.start('Generating CRUD controller...');

    // Generate controller content
    const controllerContent = generateControllerContent(modelName, schemaFields, isTS);

    // Ensure controllers directory exists
    await fs.ensureDir('src/controllers');

    // Write controller file
    const controllerPath = path.join('src', 'controllers', `${modelName}.controller.${ext}`);
    await fs.writeFile(controllerPath, controllerContent);

    s.stop('Controller generated');

    // Generate routes
    s.start('Generating CRUD routes...');
    const routeContent = generateRouteContent(modelName, isTS);

    // Ensure routes directory exists
    await fs.ensureDir('src/routes');

    // Write route file
    const routePath = path.join('src', 'routes', `${modelName}.routes.${ext}`);
    await fs.writeFile(routePath, routeContent);

    s.stop('Routes generated');

    // Generate validation schemas if Zod is detected
    const packageJson = fs.existsSync('package.json') ? await fs.readJSON('package.json') : {};
    if (packageJson.dependencies?.zod) {
        s.start('Generating validation schemas...');
        const validationContent = generateValidationContent(modelName, schemaFields, isTS);

        await fs.ensureDir('src/validators');
        const validationPath = path.join('src', 'validators', `${modelName}.validator.${ext}`);
        await fs.writeFile(validationPath, validationContent);

        s.stop('Validation schemas generated');
    }

    outro(`${chalk.green('CRUD operations generated successfully!')}
    
${chalk.bold('Generated files:')}
${chalk.cyan(`  • src/controllers/${modelName}.controller.${ext}`)}
${chalk.cyan(`  • src/routes/${modelName}.routes.${ext}`)}
${packageJson.dependencies?.zod ? chalk.cyan(`  • src/validators/${modelName}.validator.${ext}`) : ''}

${chalk.bold('Next steps:')}
${chalk.cyan(`  • Import and use the routes in your main app file`)}
${chalk.cyan(`  • Example: app.use('/api/${modelName.toLowerCase()}', ${modelName}Routes)`)}
`);
}

function extractSchemaFields(modelContent) {
    const fields = [];

    // Extract fields from mongoose schema
    const schemaRegex = /(\w+):\s*{\s*type:\s*([^,}]+)(?:,\s*required:\s*([^,}]+))?(?:,\s*default:\s*([^,}]+))?(?:,\s*select:\s*([^,}]+))?(?:,\s*unique:\s*([^,}]+))?(?:,\s*enum:\s*\[([^\]]+)\])?[^}]*}/g;

    let match;
    while ((match = schemaRegex.exec(modelContent)) !== null) {
        const fieldName = match[1];
        const fieldType = match[2].trim();
        const required = match[3] === 'true' || match[3] === 'false' ? match[3] === 'true' : false;
        const defaultValue = match[4] ? match[4].trim() : null;
        const select = match[5] === 'true' || match[5] === 'false' ? match[5] === 'true' : true;
        const unique = match[6] === 'true' || match[6] === 'false' ? match[6] === 'true' : false;
        const enumValues = match[7] ? match[7].split(',').map(v => v.trim().replace(/['"]/g, '')) : null;

        fields.push({
            name: fieldName,
            type: fieldType,
            required,
            default: defaultValue,
            select,
            unique,
            enum: enumValues
        });
    }

    return fields;
}

function generateControllerContent(modelName, fields, isTS) {
    const capitalizedName = modelName.charAt(0).toUpperCase() + modelName.slice(1);
    const lowerModelName = modelName.toLowerCase();

    const imports = `import ${capitalizedName} from '../models/${modelName}${isTS ? '.js' : ''}';${isTS ? `
import { Request, Response, NextFunction } from 'express';` : ''}`;

    const typeAnnotation = isTS ? ': Request, res: Response, next: NextFunction' : '';

    return `${imports}

// @desc    Create new ${lowerModelName}
// @route   POST /api/${lowerModelName}
// @access  Public
export const create${capitalizedName} = async (req${typeAnnotation}) => {
    try {
        const new${capitalizedName} = new ${capitalizedName}(req.body);
        const saved${capitalizedName} = await new${capitalizedName}.save();
        res.status(201).json({
            success: true,
            data: saved${capitalizedName}
        });
    } catch (error${isTS ? ': any' : ''}) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all ${lowerModelName}s
// @route   GET /api/${lowerModelName}
// @access  Public
export const getAll${capitalizedName}s = async (req${typeAnnotation}) => {
    try {
        const page = parseInt(req.query.page${isTS ? ' as string' : ''}) || 1;
        const limit = parseInt(req.query.limit${isTS ? ' as string' : ''}) || 10;
        const skip = (page - 1) * limit;
        
        const ${lowerModelName}s = await ${capitalizedName}.find()
            .select(${fields.filter(f => f.select).map(f => `'${f.name}'`).join(' ') || "'__v'"})
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });
            
        const total = await ${capitalizedName}.countDocuments();
        
        res.status(200).json({
            success: true,
            data: ${lowerModelName}s,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error${isTS ? ': any' : ''}) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get ${lowerModelName} by ID
// @route   GET /api/${lowerModelName}/:id
// @access  Public
export const get${capitalizedName}ById = async (req${typeAnnotation}) => {
    try {
        const ${lowerModelName} = await ${capitalizedName}.findById(req.params.id);
        
        if (!${lowerModelName}) {
            return res.status(404).json({
                success: false,
                message: '${capitalizedName} not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: ${lowerModelName}
        });
    } catch (error${isTS ? ': any' : ''}) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update ${lowerModelName}
// @route   PUT /api/${lowerModelName}/:id
// @access  Public
export const update${capitalizedName} = async (req${typeAnnotation}) => {
    try {
        const ${lowerModelName} = await ${capitalizedName}.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!${lowerModelName}) {
            return res.status(404).json({
                success: false,
                message: '${capitalizedName} not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: ${lowerModelName}
        });
    } catch (error${isTS ? ': any' : ''}) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete ${lowerModelName}
// @route   DELETE /api/${lowerModelName}/:id
// @access  Public
export const delete${capitalizedName} = async (req${typeAnnotation}) => {
    try {
        const ${lowerModelName} = await ${capitalizedName}.findByIdAndDelete(req.params.id);
        
        if (!${lowerModelName}) {
            return res.status(404).json({
                success: false,
                message: '${capitalizedName} not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: '${capitalizedName} deleted successfully'
        });
    } catch (error${isTS ? ': any' : ''}) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
`;
}

function generateRouteContent(modelName, isTS) {
    const capitalizedName = modelName.charAt(0).toUpperCase() + modelName.slice(1);
    const lowerModelName = modelName.toLowerCase();

    const imports = `import express from 'express';
import { 
    create${capitalizedName},
    getAll${capitalizedName}s,
    get${capitalizedName}ById,
    update${capitalizedName},
    delete${capitalizedName}
} from '../controllers/${modelName}.controller${isTS ? '.js' : ''}';${isTS ? `
import { Request, Response, NextFunction } from 'express';` : ''}`;

    return `${imports}

const router = express.Router();

router.post('/', create${capitalizedName});
router.get('/', getAll${capitalizedName}s);
router.get('/:id', get${capitalizedName}ById);
router.put('/:id', update${capitalizedName});
router.delete('/:id', delete${capitalizedName});

export default router;
`;
}

function generateValidationContent(modelName, fields, isTS) {
    const capitalizedName = modelName.charAt(0).toUpperCase() + modelName.slice(1);

    let validationFields = '';

    fields.forEach(field => {
        let fieldValidation = `  ${field.name}: z`;

        // Map mongoose types to zod types
        switch (field.type) {
            case 'String':
                fieldValidation += '.string()';
                if (field.required) fieldValidation += '.min(1)';
                break;
            case 'Number':
                fieldValidation += '.number()';
                break;
            case 'Boolean':
                fieldValidation += '.boolean()';
                break;
            case 'Date':
                fieldValidation += '.date()';
                break;
            case 'Array':
                fieldValidation += '.array()';
                break;
            case 'Object':
                fieldValidation += '.object({})';
                break;
            default:
                fieldValidation += '.any()';
        }

        if (field.enum) {
            fieldValidation += `.enum([${field.enum.map(v => `'${v}'`).join(', ')}])`;
        }

        if (field.required) {
            fieldValidation += '';
        } else {
            fieldValidation += '.optional()';
        }

        if (field.default && field.default !== 'null') {
            fieldValidation += `.default(${field.default})`;
        }

        validationFields += fieldValidation + ',\n';
    });

    return `import { z } from 'zod';

export const create${capitalizedName}Schema = z.object({
${validationFields}
});

export const update${capitalizedName}Schema = z.object({
${validationFields}
}).partial();

export const ${modelName}IdSchema = z.object({
    id: z.string().min(1, 'ID is required')
});

export type Create${capitalizedName}Input = z.infer<typeof create${capitalizedName}Schema>;
export type Update${capitalizedName}Input = z.infer<typeof update${capitalizedName}Schema>;
`;
}

main().catch(console.error);
