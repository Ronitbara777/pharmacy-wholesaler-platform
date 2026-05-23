# Pharmacy Wholesaler Platform

A comprehensive full-stack solution designed for pharmacy wholesalers to manage their inventory, process orders, and handle invoices efficiently. The platform includes a robust Node.js/Express backend and a cross-platform React Native (Expo) mobile application.

## Features
- **Centralized Dashboard**: Track activities, notifications, and overall inventory status.
- **Inventory Management**: Add, update, and manage pharmaceutical stock items.
- **Document Processing**: OCR-powered document scanning for receipts and invoices using Tesseract and PDF parsing.
- **User Authentication**: Secure role-based access control.
- **Reporting & Analytics**: Data visualization and CSV/Excel import/export capabilities.

## Project Structure
The repository is split into two main components:
- [`/backend`](./backend) - Node.js REST API with Prisma and PostgreSQL.
- [`/mobile`](./mobile) - React Native (Expo) mobile application.

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL
- React Native environment / Expo Go

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd pharmacy-wholesaler-platform
   ```

2. Setup the backend
   Navigate to the `backend` directory and follow the instructions in the [Backend README](./backend/README.md).

3. Setup the mobile app
   Navigate to the `mobile` directory and follow the instructions in the [Mobile README](./mobile/README.md).

## Technologies Used
- **Backend**: Node.js, Express, Prisma, PostgreSQL, Tesseract.js (OCR), JSON Web Tokens (JWT).
- **Mobile**: React Native, Expo, React Navigation, React Native Paper.
