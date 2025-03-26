FROM node:18-alpine as build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install production dependencies only
RUN npm ci --production

# Copy built assets from the build stage
COPY --from=build /app/dist /app/dist

# Expose port 8080
EXPOSE 8080

# Set production environment
ENV NODE_ENV=production
ENV PORT=8080

# Run the server
CMD ["node", "dist/server/server.js"] 