# Build stage
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies first (for better caching)
COPY package.json yarn.lock tsconfig.json ./
COPY .yarnrc.prod.yml ./.yarnrc.yml
COPY .yarn ./.yarn

# Install dependencies
RUN yarn install

# Copy the rest of the application
COPY src ./src

# Build the application
RUN yarn && yarn build && yarn workspaces focus --production

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Expose the port the app runs on
EXPOSE 3000

# Healthcheck to ensure the application is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Command to run the application
CMD ["node", "/app/dist/index.js"]
