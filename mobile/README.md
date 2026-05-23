# Pharmacy Wholesaler Platform - Mobile App

This is the mobile application for the Pharmacy Wholesaler Platform, built using React Native and Expo. It allows users to manage inventory, view notifications, and handle warehouse activities on the go.

## Features
- **Cross-Platform**: Runs seamlessly on both iOS and Android.
- **Modern UI**: Designed with React Native Paper for a clean, accessible interface.
- **Camera & Scanning Integration**: Integrated Expo Camera and Document Picker to upload and process receipts/invoices.
- **Data Visualization**: Integrated charts to view business analytics.
- **Secure Storage**: Uses Async Storage for secure, persistent session management.

## Prerequisites
- Node.js
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Expo Go App on your physical device (or an iOS Simulator / Android Emulator)

## Installation

1. **Navigate to the mobile directory:**
   ```bash
   cd mobile
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure API Endpoints:**
   Ensure your backend API url is configured correctly in `src/services/api.js`. You might need to use your local IP address (e.g., `http://192.168.x.x:5000`) instead of `localhost` when testing on a physical device.

4. **Start the Expo Development Server:**
   ```bash
   npm start
   ```

5. **Run the App:**
   - Scan the QR code shown in your terminal with the **Expo Go** app (Android) or the native Camera app (iOS).
   - Alternatively, press `a` to run on an Android emulator, or `i` to run on an iOS simulator.

## Available Scripts
- `npm start` / `expo start`: Starts the Expo development server.
- `npm run android`: Starts the app on an Android emulator/device.
- `npm run ios`: Starts the app on an iOS simulator/device.
- `npm run web`: Runs the app in a web browser.
