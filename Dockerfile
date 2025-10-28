# Stage 1: Build Angular app
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy all files and build the app
COPY . .
RUN npm run build --omit=dev

# Stage 2: Serve using NGINX
FROM nginx:alpine
COPY --from=build /app/dist/form /usr/share/nginx/html

# Optional: Replace default nginx.conf with custom one if needed
# COPY nginx.conf /etc/nginx/conf.d/default.conf
