# Stage 1: Build the Expo Web App
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy App package files
COPY App/package*.json ./

# Install dependencies and web support
RUN npm install && \
    npx expo install react-native-web react-dom @expo/metro-runtime --fix

# Copy the rest of the App source
COPY App/ .

# Build the Expo web app
# Note: EXPO_PUBLIC_API_URL is baked in at build time. 
# We default to the Render URL provided in the screenshot.
ARG EXPO_PUBLIC_API_URL=https://bookforme-ie34.onrender.com
ENV EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL}
RUN npx expo export --platform web

# Stage 2: Python Backend
FROM python:3.11-slim
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy backend code
COPY backend/ ./backend/
COPY app.py .

# Copy the built web app from Stage 1 into the backend static folder
COPY --from=frontend-builder /app/frontend/dist ./backend/static/app_dist

# Expose port
EXPOSE 8000

# Start the application
CMD ["python", "app.py"]
