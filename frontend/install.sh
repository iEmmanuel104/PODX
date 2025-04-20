#!/bin/bash

# Exit on error
set -e

echo "Installing dependencies for PODX Frontend..."

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Install dependencies with legacy peer deps
npm install --legacy-peer-deps

echo "Dependencies installed successfully!"
echo "You can now run 'npm start' to start the development server." 