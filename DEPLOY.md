# Open-Temp-Mail Deployment Guide

This guide provides step-by-step instructions to deploy the Open-Temp-Mail application to Cloudflare Workers. It covers everything from setting up your environment to rigorous verification.

## Prerequisites

Before starting, ensure you have the following installed:

1.  **Node.js & npm**: Download and install from [Node.js official website](https://nodejs.org/). (Version 18 or higher recommended).
2.  **Git**: Download and install from [Git official website](https://git-scm.com/).
3.  **Cloudflare Account**: Sign up at [Cloudflare](https://dash.cloudflare.com/sign-up) if you don't have one.

---

## Automated Deployment (Recommended)

We provide a script to automate the entire setup process.

1.  **Install & Login**:
    ```bash
    npm install -g wrangler
    wrangler login
    ```
2.  **Run Setup**:
    ```bash
    npm run deploy:setup
    ```
    Follow the interactive prompts to set up your database, secrets, and deploy.

---

## Manual Deployment

If you prefer to set up everything manually, follow these steps.

## Step 1: Install Wrangler CLI

The Wrangler CLI is the command-line tool for building and managing Cloudflare Workers.

1.  Open your terminal (Command Prompt, PowerShell, or macOS Terminal).
2.  Install Wrangler globally:
    ```bash
    npm install -g wrangler
    ```
3.  Verify the installation:
    ```bash
    wrangler --version
    ```

---

## Step 2: Login to Cloudflare

Connect your local environment to your Cloudflare account.

1.  Run the login command:
    ```bash
    wrangler login
    ```
2.  A browser window will open asking you to authorize Wrangler.
3.  Click **"Allow"**.
4.  Close the browser tab once you see the success message.
5.  In your terminal, you should see: `Successfully logged in`.

---

## Step 3: Project Setup

Navigate to the project directory and install dependencies.

1.  Open your terminal in the project folder:
    ```bash
    cd "path/to/open-temp-mail"
    ```
    *(Navigate to where you cloned the repository)*

2.  Install project dependencies:
    ```bash
    npm install
    ```

---

## Step 4: Create Cloudflare Resources

You need two main resources: a **D1 Database** (for storing user/mailbox data) and an **R2 Bucket** (for storing full email contents).

### 4.1 Create D1 Database

1.  Run the creation command:
    ```bash
    wrangler d1 create maill_free_db
    ```
2.  **Copy the output!** You will see something like this:
    ```toml
    [[d1_databases]]
    binding = "TEMP_MAIL_DB" # IMPORTANT: Must be TEMP_MAIL_DB
    database_name = "maill_free_db"
    database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    ```
3.  Open `wrangler.toml` in your text editor.
4.  Replace the `[[d1_databases]]` section with the output from **Step 2**.
    *   **CRITICAL**: Ensure `binding = "TEMP_MAIL_DB"`. If the output says "DB", change it to "TEMP_MAIL_DB".

### 4.2 Create R2 Bucket

1.  Run the creation command:
    ```bash
    wrangler r2 bucket create mail-eml
    ```
2.  Open `wrangler.toml` and verify the `[[r2_buckets]]` section:
    ```toml
    [[r2_buckets]]
    binding = "MAIL_EML"
    bucket_name = "mail-eml"
    ```

---

## Step 5: Configure Environment Variables

Open `wrangler.toml` and configure the `[vars]` section.

### Essential Variables

*   **MAIL_DOMAIN**: Your email domain(s), separated by commas.
    *   Example: `"example.com, temp.example.com"`
*   **ADMIN_NAME**: The username for the admin dashboard.
    *   Default: `"admin"`

### Secrets (Set via Wrangler CLI)

Do **NOT** put passwords in `wrangler.toml`. Set them securely using `wrangler secret put`.

Run the following commands in your terminal:

1.  **Admin Password**:
    ```bash
    wrangler secret put ADMIN_PASSWORD
    ```
    *Enter your desired strong password when prompted.*

2.  **JWT Token Secret** (for session security):
    ```bash
    wrangler secret put JWT_TOKEN
    # Enter a long, random string (e.g., generated via `openssl rand -hex 32`)
    ```

3.  **Resend API Key** (Optional, for sending emails):
    ```bash
    wrangler secret put RESEND_API_KEY
    # Enter your key from https://resend.com
    ```

---

## Step 6: Build and Deploy

Now, build the frontend and deploy the full stack to Cloudflare.

1.  **Build the Frontend**:
    This compiles your React code into static assets in the `dist/` folder.
    ```bash
    npm run build
    ```

2.  **Deploy to Cloudflare Workers**:
    This uploads your backend code and the static assets.
    ```bash
    wrangler deploy
    ```

3.  **Success!**
    The terminal will output your Worker's URL, e.g., `https://open-temp-mail.your-subdomain.workers.dev`.

---

## Step 7: Post-Deployment Configuration

### 7.1 Setup Email Routing (Catch-All)

To receive emails, you must configure Cloudflare Email Routing.

1.  Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2.  Select your domain.
3.  Navigate to **Email** > **Email Routing**.
4.  Click **"Get Started"** if not already enabled.
5.  Go to the **Routes** tab.
6.  Click **Create Custom Address**.
    -   **Custom Address**: Enter `*` (Catch-all) to receive emails for any address (e.g., `anything@yourdomain.com`).
    -   **Action**: `Send to a Worker`.
    -   **Destination**: Select your newly deployed Worker (`open-temp-mail`).
7.  Click **Save**.

### 7.2 Verify Deployment

1.  Open your Worker URL in a browser.
2.  You should see the Open-Temp-Mail login page.
3.  Login with `admin` and the password you set in **Step 5**.
4.  Try creating a random mailbox to test database connectivity.
5.  Try sending an email to that mailbox (from an external account like Gmail) to test Email Routing.

---

## Troubleshooting

-   **Frontend loads blank**: Open your browser's Developer Tools (F12) -> Console. Check for errors.
-   **Database errors**: Ensure you ran the `d1 execute` command (Step 4.2).
-   **"Uncaught (in promise)"**: Check your `wrangler secret list` to ensure all secrets are set.
-   **Email not received**: Verify your domain's MX records in Cloudflare DNS settings match what Email Routing requires.

---

## Local Development

You can run the application locally in two modes: **Local Mode** (using a local temporary database) or **Remote Mode** (connecting to your live Cloudflare D1 database).

### Option 1: Local Backend (Default)
*Use this for safe development without affecting production data.*

1.  **Start Frontend**:
    ```bash
    npm run dev
    ```
    (Runs on `http://localhost:5173`)

2.  **Start Backend** (in a new terminal):
    ```bash
    npm run dev:backend
    ```
    (Runs on `http://localhost:8787` using a local SQLite file)

### Option 2: Remote Backend (Live Data)
*Use this to debug with your actual production database.*

1.  **Start Frontend**:
    ```bash
    npm run dev
    ```

2.  **Start Backend** (in a new terminal):
    ```bash
    npm run dev:backend:remote
    ```
    (Runs on `http://localhost:8787` but connects to your generic Cloudflare D1 DB)

