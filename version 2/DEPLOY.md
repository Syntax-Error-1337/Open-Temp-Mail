# Freemail Version 2 Deployment Guide

This guide provides step-by-step instructions to deploy the Freemail Version 2 application to Cloudflare Workers. It covers everything from setting up your environment to rigorous verification.

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
    cd "version 2"
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

1.  Open your terminal in the `version 2` folder of your project:
    ```bash
    cd "path/to/freemail/version 2"
    ```
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
    binding = "DB" # i.e. available in your Worker on env.DB
    database_name = "maill_free_db"
    database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    ```
3.  Open `wrangler.toml` in your text editor.
4.  Find the `[[d1_databases]]` section.
5.  Update the `database_id` with the one you just copied. **Do not change the `binding` name (`TEMP_MAIL_DB`)**, as the code relies on it.

### 4.2 Initialize Database Schema

Apply the database structure (tables) to your new D1 database.

1.  Run the execute command:
    ```bash
    wrangler d1 execute maill_free_db --file=d1-init.sql
    ```
2.  Type `y` if prompted to confirm (for remote databases).

### 4.3 Create R2 Bucket

1.  Run the create command:
    ```bash
    wrangler r2 bucket create mail-eml
    ```
2.  Confirm it matches the `bucket_name` in your `wrangler.toml` (default is `mail-eml`).

---

## Step 5: Configure Secrets

Set up secure environment variables for your application.

1.  **Strict Admin Password** (Required):
    ```bash
    wrangler secret put ADMIN_PASSWORD
    # Enter your desired rigorous password when prompted
    ```

2.  **JWT Signing Token** (Required):
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
    The terminal will output your Worker's URL, e.g., `https://freemail-v2.your-subdomain.workers.dev`.

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
    -   **Destination**: Select your newly deployed Worker (`freemail-v2`).
7.  Click **Save**.

### 7.2 Verify Deployment

1.  Open your Worker URL in a browser.
2.  You should see the Freemail login page.
3.  Login with `admin` and the password you set in **Step 5**.
4.  Try creating a random mailbox to test database connectivity.
5.  Try sending an email to that mailbox (from an external account like Gmail) to test Email Routing.

---

## Troubleshooting

-   **Frontend loads blank**: Open your browser's Developer Tools (F12) -> Console. Check for errors.
-   **Database errors**: Ensure you ran the `d1 execute` command (Step 4.2).
-   **"Uncaught (in promise)"**: Check your `wrangler secret list` to ensure all secrets are set.
-   **Email not received**: Verify your domain's MX records in Cloudflare DNS settings match what Email Routing requires.
