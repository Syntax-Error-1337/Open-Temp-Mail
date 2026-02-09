# 📬 Open-Temp-Mail

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/deploy-button.svg)](https://deploy.workers.cloudflare.com/?url=https://github.com/yourusername/open-temp-mail)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![Status](https://img.shields.io/badge/status-stable-success.svg)

**Open-Temp-Mail** is a modern, high-performance temporary email service built for speed, privacy, and ease of deployment. Engineered with React, Vite, and Cloudflare Workers, it provides a seamless disposable email experience with a premium UI.

---

## ✨ Features

- **🚀 Blazing Fast**: Powered by Cloudflare Workers for edge-latency global performance.
- **🛡️ Privacy First**: Completely anonymous and disposable inboxes.
- **🎨 Stunning UI**: A beautiful, dark-mode focused interface built with **Tailwind CSS v4**.
- **📱 Fully Responsive**: Optimized for mobile, tablet, and desktop experiences.
- **🔐 Secure Access**: Role-based authentication for Admins and Users.
- **📨 Advanced Mailbox Tools**:
    - **⭐ Favorites**: Pin important inboxes for quick access.
    - **🔄 Forwarding Rules**: Set up auto-forwarding to real email addresses.
    - **👁️ Sanitized Viewing**: Safe HTML email rendering with XSS protection.
    - **🔍 Filtering**: Filter by All, Favorites, or Forwarding status.

## 🛠️ Tech Stack

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![D1 Database](https://img.shields.io/badge/Cloudflare_D1-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+
- **Cloudflare Account** (for Workers & D1)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/open-temp-mail.git
    cd open-temp-mail
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Visit `http://localhost:5173` to view the app.

## 📦 Deployment

Open-Temp-Mail is designed to be deployed effortlessly to Cloudflare.

### One-Click Deployment
For a quick setup, run the automated setup script:
```bash
npm run deploy:setup
```
This script will automate resource creation (D1 User DB), configuration, and initial deployment.

### Manual Deployment
For granular control over the deployment process, please refer to the detailed **[DEPLOY.md](./DEPLOY.md)** guide.

## 📂 Project Structure

```bash
open-temp-mail/
├── 📂 src/             # React Frontend Data & Components
├── 📂 worker/          # Cloudflare Worker Backend Logic
├── 📂 scripts/         # Setup & Utility Scripts
├── 📜 wrangler.toml    # Cloudflare Configuration
└── 📄 package.json     # Project Dependencies
```

---

<p align="center">
  Built with ❤️ by the Open Source Community
</p>
