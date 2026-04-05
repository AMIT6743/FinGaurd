# Stage 1: Build the React application
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
# Install frontend deps
COPY frontend/package*.json ./
RUN npm install
# Build the frontend
COPY frontend/ .
# VITE_API_URL is empty so it uses relative /api paths handled by the backend
RUN VITE_API_URL="" npm run build

# Stage 2: Build the Node backend & finalize image
FROM node:20-alpine
WORKDIR /app
# Set environment
ENV NODE_ENV=production

# Install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production

# Copy backend source code
COPY backend/ ./backend/

# Copy the built frontend into the expected location for static serving
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose the backend port
EXPOSE 3000

# Start the application from the backend directory
WORKDIR /app/backend
CMD ["npm", "start"]
