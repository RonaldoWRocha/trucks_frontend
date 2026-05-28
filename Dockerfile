# Use an official Node.js runtime as a parent image
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Allow passing API URL at build time so `NEXT_PUBLIC_API_URL` is embedded in the client
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Create a .env file so Next.js reads `NEXT_PUBLIC_API_URL` at build time
# This makes the project rely only on a `.env` file as requested
RUN echo "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}" > .env

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source
COPY . .

# Build production assets
RUN npm run build

# Production image
FROM node:20-alpine AS runner
WORKDIR /usr/src/app

# Copy only needed files
COPY package.json package-lock.json ./
RUN npm ci --production

COPY --from=builder /usr/src/app/.next .next
COPY --from=builder /usr/src/app/next.config.mjs ./next.config.mjs
COPY --from=builder /usr/src/app/public ./public

# Expose Next.js default port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
