# Freemail Version 2

A modern, responsive frontend for the Freemail application, built with React, Vite, and Tailwind CSS.

## Features
- **Modern UI**: Clean interface built with Tailwind CSS v4.
- **Authentication**: Secure login for Admins, Users, and Mailbox accounts.
- **Dashboard**: Overview of system status and mailboxes.
- **Mailbox Management**: 
    - **Favorites**: Star important mailboxes for quick access.
    - **Filtering**: Easily filter by All, Favorites, or Forwarding status.
    - **Forwarding**: Set up auto-forwarding rules for mailboxes.
- **Mailbox**: Real-time email listing and reading with sanitized HTML view.
- **Responsive**: Fully optimized for mobile and desktop.

## Getting Started

### Prerequisites
- Node.js 18+
- Backend Cloudflare Worker running locally (default port 8787).

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open `http://localhost:5173` in your browser.

## Configuration
The frontend is configured to proxy API requests to `http://localhost:8787`.
To change this, edit `vite.config.ts`.

## Deployment
See [DEPLOY.md](DEPLOY.md) for detailed deployment instructions using Cloudflare Workers.

To build for production:
```bash
npm run build
```
The output will be in the `dist` directory, which is served by the Cloudflare Worker.
