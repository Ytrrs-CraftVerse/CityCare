# CityCare - Smart City Public Works Feedback System

CityCare is a citizen platform to report civic issues (potholes, streetlights, dumping) with location and photos, enabling faster resolution and transparency.

## Tech Stack
- **Frontend**: React (Vite, TypeScript, Leaflet, Chart.js)
- **Backend**: Node.js (Express, Mongoose, Multer)
- **Database**: MongoDB

## Prerequisites
1.  **Node.js**: [Download and Install Node.js](https://nodejs.org/)
2.  **MongoDB**: [Download and Install MongoDB Community Server](https://www.mongodb.com/try/download/community)
    - Ensure MongoDB is running on `mongodb://localhost:27017`

## Setup & Running

### 1. Backend Setup
1.  Navigate to the `server` directory: `cd server`
2.  Install dependencies: `npm install`
3.  Create a `.env` file (one has been provided for you):
    ```env
    PORT=5000
    MONGODB_URI=mongodb://localhost:27017/citycare
    ```
4.  Start the server: `npm run dev` (or `node index.js`)

### 2. Frontend Setup
1.  Navigate to the `client` directory: `cd client`
2.  Install dependencies: `npm install`
3.  Start the development server: `npm run dev`
4.  Open your browser at the URL provided (typically `http://localhost:5173`)

## Features
- **Issue Reporting**: Pin locations on a map and upload photos of civic problems.
- **Public Dashboard**: View all reported issues on a map or list.
- **Real-time Stats**: Track resolution rates and problem hotspots.
- **Premium UI**: Modern design with glassmorphism and responsiveness.
