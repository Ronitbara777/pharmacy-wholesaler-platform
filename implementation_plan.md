# Full-Stack Deployment Plan (Dockerized)

This document outlines the step-by-step strategy for deploying your **Pharmacy Wholesaler Platform** to production, utilizing Docker containerization for maximum reliability. As requested, no code will be changed during this planning phase.

## Why Use Docker? (Benefits & Relevance)
Containerizing your backend is **highly beneficial** and extremely relevant for this project. Here is why:
1. **"It Works on My Machine" Guarantee:** Docker packages your Node.js code, all its dependencies (like Prisma and Tesseract), and the exact operating system it needs into one box. It guarantees that if it runs on your Windows computer, it will run exactly the same way on the production server.
2. **Simplified Cloud Deployment:** Cloud platforms like Render, AWS, and DigitalOcean have native Docker support. Instead of manually configuring a server, you just hand them your Docker container and they run it instantly.
3. **Easier Local Testing:** Since you are already running PostgreSQL via Docker (as we saw earlier), containerizing your backend means you can spin up the *entire* stack (Database + Backend) with a single `docker-compose up` command.

---

## Phase 1: Backend Deployment (Dockerized)
**Recommended Platform:** [Render.com](https://render.com/) or Railway (Both have excellent native Docker support).

### Step 1.1: Containerize the Node.js API
1. We will create a `Dockerfile` in the `backend` folder. This file will:
   - Use a lightweight Linux image (like `node:18-alpine`).
   - Copy your code and `package.json` over.
   - Run `npm install` and `npx prisma generate` inside the container.
   - Expose port `5000` and define the start command.
2. We will optionally create a `.dockerignore` file to prevent heavy local folders (like `node_modules` or local `uploads`) from slowing down the build.

### Step 1.2: Set up the Production Database
1. Create a free PostgreSQL instance on Render.
2. Render will provide an **Internal Database URL** (for the backend server to talk to it securely).

### Step 1.3: Deploy the Docker Container
1. Connect your GitHub repository to Render and create a new **Web Service**.
2. Select **Docker** as the environment (instead of native Node). Render will automatically detect your `Dockerfile`, build the image, and start it.
3. Set your Environment Variables (`DATABASE_URL`, `JWT_SECRET`, etc.) in the Render dashboard.

---

## Phase 2: Mobile App Deployment (React Native / Expo)
**Recommended Platform:** Expo Application Services (EAS)

### Step 2.1: Update the API URL
Once the Docker backend is live, Render will give you a live URL (e.g., `https://pharmacy-backend.onrender.com`).
1. We will update `mobile/src/services/api.js` so that `BASE_URL` points to this live Render URL.

### Step 2.2: Configure Expo Build Settings
1. Initialize an `eas.json` configuration file in the `mobile` folder.
2. Ensure the `app.json` has a unique `android.package` name (e.g., `com.yourname.pharmacyapp`).

### Step 2.3: Build the App
1. Run `eas build -p android --profile preview` to generate a downloadable `.apk` file for testing.
2. Run `eas build -p android --profile production` to generate the `.aab` bundle for the Google Play Store.

## User Review Required

> [!IMPORTANT]
> **Next Actions**
> 1. Are you ready for me to write the `Dockerfile` and `.dockerignore` for your backend? 
> 2. Once the Docker setup is coded, we can push it to GitHub and you can connect your repository to Render to launch it!
