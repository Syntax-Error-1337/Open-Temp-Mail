# Deploy Guide

## Prerequisites

- Node.js & npm installed
- Cloudflare Wrangler CLI installed (`npm install -g wrangler`)
- A Cloudflare account

## Setup

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Configure Environment**:
    -   Copy `.env.example` to `.env` (for local development using Vite's proxy, though `wrangler.toml` handles production vars).
    -   Update `wrangler.toml` with your D1 Database ID and Name.
    -   Set secrets in Cloudflare dashboard OR via wrangler:
        ```bash
        wrangler secret put ADMIN_PASSWORD
        wrangler secret put JWT_TOKEN
        wrangler secret put RESEND_API_KEY
        # ... other variables
        ```

3.  **Database Initialization**:
    -   If you haven't created the database yet:
        ```bash
        wrangler d1 create maill_free_db
        ```
    -   Initialize the schema:
        ```bash
        wrangler d1 execute maill_free_db --file=d1-init.sql
        ```

## Development

1.  **Frontend & Backend**:
    -   Run `npm run dev` to start the Vite dev server.
    -   Note: The Vite dev server proxies API requests to `http://localhost:8787`. You will need to run the worker locally separately or adjust the proxy target.
    -   **Better Approach**: Run `wrangler dev` to serve both the worker and the static assets (after building).

    ```bash
    npm run build
    wrangler dev
    ```

## Deployment

1.  **Build Frontend**:
    ```bash
    npm run build
    ```

2.  **Deploy to Cloudflare Workers**:
    ```bash
    wrangler deploy
    ```

## Verification

-   Visit your worker URL (e.g., `https://freemail-v2.your-subdomain.workers.dev`).
-   Log in with the credentials you set.
