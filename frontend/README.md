# PODX Video Conferencing App

A React-based video conferencing application using Huddle01 iFrame integration.

## Prerequisites

- Node.js (latest stable version)
- npm or pnpm

## Setup

1. Clone this repository
2. Navigate to the frontend directory
3. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   pnpm install
   ```

4. Create a `.env` file in the root directory with the following variables:
   ```
   REACT_APP_HUDDLE01_PROJECT_ID=your_project_id
   REACT_APP_HUDDLE01_ROOM_ID=your_room_id
   REACT_APP_HUDDLE01_ACCESS_TOKEN=your_access_token
   ```

   You can obtain these values from:
   - Project ID: Huddle01 Developer Dashboard
   - Room ID: Create a room using the Huddle01 Create Room API
   - Access Token: Generate using the Huddle01 Access Token API

## Running the App

To start the development server:

```
npm start
```

or

```
pnpm start
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Features

- Video conferencing with Huddle01
- Microphone mute/unmute
- Screen sharing
- Recording capabilities
- Reactions
- Virtual backgrounds

## Building for Production

To build the app for production:

```
npm run build
```

or

```
pnpm build
```

The build output will be in the `build` directory. 