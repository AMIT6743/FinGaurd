FROM node:20-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy package info and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the remaining backend source code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
