import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    cyan: "\x1b[36m"
};

const step = (msg) => console.log(`\n${colors.cyan}➤ ${msg}${colors.reset}`);
const success = (msg) => console.log(`${colors.green}✔ ${msg}${colors.reset}`);
const warn = (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`);
const error = (msg) => {
    console.error(`${colors.red}✘ ${msg}${colors.reset}`);
    process.exit(1);
};

const run = (cmd, options = {}) => {
    try {
        // Prepare options for execSync
        const execOptions = { ...options };
        if (options.input) {
            execOptions.input = options.input;
            delete execOptions.input; // Remote input from options passed to execSync if it's not supported directly in the spread (though it is for some node versions, let's be safe)
        }
        
        // If providing input, we must rely on the provided stdio or default to pipe for stdin
        // execSync with input handles stdin automatically if not overridden to something incompatible
        const result = execSync(cmd, { stdio: 'pipe', encoding: 'utf-8', ...options });
        return result ? result.trim() : null;
    } catch (e) {
        if (options.ignoreError) return null;
        throw e;
    }
};

const ask = (question) => new Promise((resolve) => rl.question(`${colors.bright}${question}${colors.reset} `, resolve));

async function main() {
    console.log(`${colors.bright}🚀 Open-Temp-Mail - One-Click Deployment Setup${colors.reset}\n`);

    // 1. Check prerequisites
    step('Checking prerequisites...');
    try {
        run('wrangler --version');
        success('Wrangler CLI is installed.');
    } catch (e) {
        error('Wrangler CLI is not installed. Please run: npm install -g wrangler');
    }

    // 2. Install dependencies
    step('Installing dependencies...');
    try {
        run('npm install --legacy-peer-deps', { stdio: 'inherit' });
        success('Dependencies installed.');
    } catch (e) {
        error('Failed to install dependencies.');
    }

    // 3. Login check
    step('Checking Cloudflare login status...');
    try {
        const whoami = run('wrangler whoami');
        if (whoami.includes('You are logged in')) {
            success('Logged in to Cloudflare.');
        } else {
            warn('Not logged in. Opening browser...');
            run('wrangler login', { stdio: 'inherit' });
        }
    } catch (e) {
        warn('Could not verify login status. Attempting login...');
        run('wrangler login', { stdio: 'inherit' });
    }

    // 4. D1 Database Setup
    step('Setting up D1 Database...');
    const wranglerPath = path.resolve(__dirname, '../wrangler.toml');
    let dbId;
    let wranglerConfig = fs.readFileSync(wranglerPath, 'utf-8');

    // Check if DB already exists or is configured
    const dbName = 'maill_free_db';
    try {
        const d1List = run(`wrangler d1 list --json`);
        const dbs = JSON.parse(d1List);
        const existingDb = dbs.find(db => db.name === dbName);

        if (existingDb) {
            dbId = existingDb.uuid;
            success(`Database '${dbName}' already exists (ID: ${dbId}).`);
        } else {
            console.log('Creating new D1 database...');
            const createOutput = run(`wrangler d1 create ${dbName}`);
            const match = createOutput.match(/database_id\s*=\s*"([a-f0-9-]+)"/);
            if (match && match[1]) {
                dbId = match[1];
                success(`Created database '${dbName}' (ID: ${dbId}).`);
            } else {
                // Fallback: list again
                const d1ListNew = run(`wrangler d1 list --json`);
                const dbsNew = JSON.parse(d1ListNew);
                const newDb = dbsNew.find(db => db.name === dbName);
                if (newDb) {
                    dbId = newDb.uuid;
                } else {
                    throw new Error('Failed to create database or retrieve ID.');
                }
            }
        }
    } catch (e) {
        error(`Failed to setup D1 database: ${e.message}`);
    }

    // Update wrangler.toml
    if (dbId) {
        const newConfig = wranglerConfig.replace(
            /database_id\s*=\s*".*"/,
            `database_id = "${dbId}"`
        );
        fs.writeFileSync(wranglerPath, newConfig);
        success('Updated wrangler.toml with Database ID.');
    }

    // Initialize Schema
    step('Initializing Database Schema...');
    try {
        run(`wrangler d1 execute ${dbName} --file=d1-init.sql --remote --yes`);
        success('Database schema applied.');
    } catch (e) {
        warn(`Failed to apply schema. It might already be applied or there's a connection issue. Error: ${e.message}`);
    }

    // 5. R2 Bucket Setup
    step('Setting up R2 Bucket...');
    const bucketName = 'mail-eml';
    try {
        run(`wrangler r2 bucket create ${bucketName}`);
        success(`R2 Bucket '${bucketName}' created/verified.`);
    } catch (e) {
        if (e.message.includes('already exists')) {
            success(`R2 Bucket '${bucketName}' already exists.`);
        } else {
            warn(`Could not create R2 bucket (it might already exist). Continuing...`);
        }
    }

    // 6. Secrets
    step('Configuring Secrets...');
    console.log('We need to set up your Admin Password and JWT Token.');

    // Check if secrets likely exist (rudimentary check, or just prompt to overwrite)
    const adminPassword = await ask('Enter a secure Admin Password:');
    if (adminPassword) {
        // Use input option to pass password to stdin, avoiding echo and potential shell issues
        try {
            run('wrangler secret put ADMIN_PASSWORD', { input: adminPassword, stdio: ['pipe', 'pipe', 'inherit'] });
            success('ADMIN_PASSWORD set.');
        } catch (e) {
            error(`Failed to set ADMIN_PASSWORD: ${e.message}`);
        }
    }

    const jwtToken = await ask('Enter a random JWT Token (or press Enter to generate one):');
    let finalJwt = jwtToken;
    if (!finalJwt) {
        finalJwt = crypto.randomBytes(32).toString('hex');
        console.log(`Generated JWT Token: ${finalJwt}`);
    }
    try {
        run('wrangler secret put JWT_TOKEN', { input: finalJwt, stdio: ['pipe', 'pipe', 'inherit'] });
        success('JWT_TOKEN set.');
    } catch (e) {
        error(`Failed to set JWT_TOKEN: ${e.message}`);
    }

    const resendApiKey = await ask('Enter your Resend API Key (optional, for sending emails):');
    if (resendApiKey) {
        try {
            run('wrangler secret put RESEND_API_KEY', { input: resendApiKey, stdio: ['pipe', 'pipe', 'inherit'] });
            success('RESEND_API_KEY set.');
        } catch (e) {
            error(`Failed to set RESEND_API_KEY: ${e.message}`);
        }
    }

    const mailDomain = await ask('Enter your Mail Domain (e.g., example.com):');
    if (mailDomain) {
        // Update MAIL_DOMAIN in wrangler.toml (it's defined as an env var, not a secret)
        wranglerConfig = fs.readFileSync(wranglerPath, 'utf-8');
        const updatedConfig = wranglerConfig.replace(
            /MAIL_DOMAIN\s*=\s*"[^"]*"/,
            `MAIL_DOMAIN = "${mailDomain}"`
        );
        fs.writeFileSync(wranglerPath, updatedConfig);
        success(`MAIL_DOMAIN set to '${mailDomain}' in wrangler.toml.`);
    } else {
        warn('MAIL_DOMAIN not set. You may need to configure this manually in wrangler.toml.');
    }

    let finalAdminName = 'admin';
    const adminName = await ask('Enter a custom Admin Username (default: admin):');
    if (adminName && adminName.trim() !== '' && adminName.trim() !== 'admin') {
        finalAdminName = adminName.trim();
        wranglerConfig = fs.readFileSync(wranglerPath, 'utf-8');
        
        // Check if ADMIN_NAME already exists
        if (wranglerConfig.includes('ADMIN_NAME')) {
            const updatedConfig = wranglerConfig.replace(
                /ADMIN_NAME\s*=\s*"[^"]*"/,
                `ADMIN_NAME = "${finalAdminName}"`
            );
            fs.writeFileSync(wranglerPath, updatedConfig);
        } else {
            // Append to [vars] section
            if (wranglerConfig.includes('[vars]')) {
                 const updatedConfig = wranglerConfig.replace(
                    /\[vars\]/,
                    `[vars]\nADMIN_NAME = "${finalAdminName}"`
                );
                fs.writeFileSync(wranglerPath, updatedConfig);
            } else {
                fs.appendFileSync(wranglerPath, `\n[vars]\nADMIN_NAME = "${finalAdminName}"\n`);
            }
        }
        success(`ADMIN_NAME set to '${finalAdminName}' in wrangler.toml.`);
    }


    // 7. Deploy
    step('Building and Deploying...');
    try {
        run('npm run build', { stdio: 'inherit' });
        success('Build complete.');

        console.log('Deploying to Cloudflare Workers...');
        run('wrangler deploy', { stdio: 'inherit' });

        console.log(`\n${colors.green}${colors.bright}✅ Deployment Complete!${colors.reset}`);
        console.log(`\nYour app should be live. Check the URL above.`);
        console.log(`Admin User: ${finalAdminName}`);
        console.log(`Admin Password: (hidden)`);

    } catch (e) {
        error('Deployment failed.');
    }

    rl.close();
}

main().catch((err) => {
    console.error(err);
    rl.close();
    process.exit(1);
});
