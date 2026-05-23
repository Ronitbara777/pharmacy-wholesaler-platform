# Pharmacy Wholesaler Platform - Backend API

This is the RESTful API backend for the Pharmacy Wholesaler Platform. It provides secure endpoints for managing inventory, authenticating users, handling file uploads, and processing invoices using OCR.

## Features
- **RESTful API Architecture**: Built with Node.js and Express.
- **Database ORM**: Prisma Client with PostgreSQL.
- **Authentication**: Secure JWT-based authentication and bcrypt password hashing.
- **File Uploads & Processing**: Multer for uploads, PDF parsing, and Tesseract.js for OCR on scanned receipts and invoices.
- **Data Import/Export**: Support for processing CSV and Excel files.

## Prerequisites
- Node.js (v18 or higher)
- PostgreSQL Database

## Installation

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root of the `backend` directory and configure the necessary variables (e.g., Database URL, JWT Secret):
   ```env
   PORT=5000
   DATABASE_URL="postgresql://user:password@localhost:5432/pharmacy_db?schema=public"
   JWT_SECRET="your_jwt_secret_key"
   ```

4. **Run Database Migrations:**
   ```bash
   npm run prisma:migrate
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The server should now be running on `http://localhost:5000`.

## Available Scripts
- `npm run dev`: Starts the server in development mode using Nodemon.
- `npm run start`: Starts the server in production mode.
- `npm run prisma:generate`: Generates the Prisma Client.
- `npm run prisma:migrate`: Runs pending database migrations.
- `npm run prisma:studio`: Opens Prisma Studio for visual database management.
- `npm run db:seed`: Seeds the database with initial data.
