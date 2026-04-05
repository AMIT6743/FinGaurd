# Stage 1: Build the React application
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build
# VITE_API_URL is empty so the frontend uses relative /api paths,
# which NGINX will proxy to the backend container.
COPY . .
RUN VITE_API_URL="" npm run build

# Stage 2: Serve the application using NGINX
FROM nginx:alpine

# Remove the default NGINX config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom NGINX config that proxies /api to backend
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
