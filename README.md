# MCTraps.com

Our full-stack web application with React frontend and Express.js backend.

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm
- TypeScript knowledge (optional but recommended)

### Installation

1. Clone the repository
2. Install dependencies for both frontend and backend:

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install

# Return to root directory
cd ..
```

### Running the Project

To run both the frontend and backend simultaneously:

```bash
npm run dev
```

This command uses `concurrently` to start both services at the same time:
- **Frontend**: React development server (typically runs on port 3000)
- **Backend**: Express.js server (typically runs on port 5000)

### Development

- **Frontend**: Located in the `client/` directory
  - Built with React 19, TypeScript, and Material-UI
  - Includes Firebase configuration for backend services
  - Custom theme with brand colors and typography
- **Backend**: Located in the `server/` directory
  - Express.js server with TypeScript
  - API endpoint at `/api/hello` for testing
  - Runs on port 5000

### Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build the frontend for production (from client directory)
- `npm start` - Start the production server (from server directory)

### Technology Stack

- **Frontend**: React 19, TypeScript, Material-UI, Framer Motion
- **Backend**: Express.js 5, TypeScript, Node.js
- **Build Tools**: TypeScript, ts-node (dev), React Scripts
- **Additional**: Firebase integration, custom Material-UI theme

### Environment Setup

**Note**: The Firebase configuration requires environment variables. Create a `.env` file in the `client/` directory with your Firebase configuration:

```bash
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## Project Structure

```
mctraps.com/
├── client/          # React frontend (TypeScript + Material-UI + Framer Motion + Reactbits)
├── server/          # Express.js backend (TypeScript)
├── package.json     # Root package.json with concurrent scripts
└── README.md        # This file
```
