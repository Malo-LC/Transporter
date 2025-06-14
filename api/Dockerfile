# Build stage
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies first (for better caching)
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# Install dependencies
RUN yarn install

# Copy the rest of the application
COPY src ./src

# Build the application
RUN yarn && yarn build

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/index.js"] 