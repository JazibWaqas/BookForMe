# Stage 1: Build the Expo Web App
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy App package files
COPY App/package*.json ./

# Install dependencies and web support
RUN npm install && \
    npx expo install react-native-web react-dom @expo/metro-runtime --fix

# Copy the rest of the App source
COPY App/ .

# Build the Expo web app — all EXPO_PUBLIC_* vars are baked in at build time
ARG EXPO_PUBLIC_API_URL=https://bookforme-ie34.onrender.com
ARG EXPO_PUBLIC_FIREBASE_API_KEY
ARG EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG EXPO_PUBLIC_FIREBASE_PROJECT_ID
ARG EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG EXPO_PUBLIC_FIREBASE_APP_ID

ENV EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL}
ENV EXPO_PUBLIC_FIREBASE_API_KEY=${EXPO_PUBLIC_FIREBASE_API_KEY}
ENV EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=${EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN}
ENV EXPO_PUBLIC_FIREBASE_PROJECT_ID=${EXPO_PUBLIC_FIREBASE_PROJECT_ID}
ENV EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=${EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET}
ENV EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}
ENV EXPO_PUBLIC_FIREBASE_APP_ID=${EXPO_PUBLIC_FIREBASE_APP_ID}

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
