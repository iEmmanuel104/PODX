# PodX Server

This is the backend server for PodX, a real-time meeting and podcasting platform.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Project Structure](#project-structure)
3. [Key Features](#key-features)
4. [Technologies Used](#technologies-used)
5. [Configuration](#configuration)
6. [Scripts](#scripts)
7. [API Documentation](#api-documentation)
8. [Deployment](#deployment)
9. [Contributing](#contributing)
10. [License](#license)

## Getting Started

To run the server locally:

1. Clone the repository
2. Install dependencies:

bash
npm install


3. Set up environment variables (see Configuration section)
4. Start the development server:

bash
npm run dev


For production:

bash
npm run prod


## Project Structure

- src/: Contains the main server code
  - server.ts: Main entry point
  - app.ts: Express application setup
  - views/: Server-side rendered views (e.g., serverHealthCheck.ts)
  - utils/: Utility functions and constants
  - socket/: Socket.IO related code
  - middlewares/: Express and Socket.IO middlewares
  - models/: Database models (MongoDB and PostgreSQL)
  - controllers/: Request handlers
  - services/: Business logic
  - routes/: API route definitions
  - clients/: External service integrations (e.g., Cloudinary, StreamIO)
  - migrations/: Database migration files
- config/: Configuration files
- Dockerfile: Docker configuration for containerization
- .dockerignore: Specifies files to be excluded from Docker builds

## Key Features

- RESTful API for PodX frontend
- User authentication and authorization
- Real-time communication support using Socket.IO
- Database operations with Mongoose (MongoDB) and Sequelize (PostgreSQL)
- File upload handling with Multer
- Integration with external services (Cloudinary, StreamIO)
- Admin management system
- Rate limiting and error handling
- Email functionality for notifications
- Server health check endpoint

## Technologies Used

- Node.js
- TypeScript
- Express.js
- Socket.IO for real-time features
- Mongoose for MongoDB operations
- Sequelize ORM for PostgreSQL operations
- Redis for Socket.IO adapter and caching
- Docker for containerization
- Winston for logging
- Zod for schema validation
- Multer for file upload handling

## Configuration

Create a .env file in the root directory. Required variables include:


PORT=8080
MONGODB_URI=your_mongodb_connection_string
DATABASE_URL=your_postgres_connection_string
JWT_SECRET=your_jwt_secret
STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret
REDIS_URL=your_redis_url
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret


Adjust these variables according to your specific setup.

## Scripts

- npm run dev: Run the development server with nodemon
- npm run prod: Run the production server
- npm run build: Build the TypeScript code
- npm run lint: Run ESLint
- npm run db:makemigration: Run database migrations
- npm run db:undomigration: Undo the last database migration
- npm run db:newmigration: Generate a new migration file
- npm run seed: Seed the database
- npm run down: Undo all migrations

## API Documentation

The server provides a health check endpoint at "/serverhealth". It returns an HTML page with server status and links to documentation, client-side website, and admin dashboard.

For other API endpoints, please refer to the routes/ directory or create separate API documentation.

## Deployment

This server can be deployed using Docker. The Dockerfile is set up to create a production-ready image.

To build and run the Docker image:

bash
docker build -t podx-server .
docker run -p 8080:8080 podx-server


Make sure to set up the necessary environment variables when running the container.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
