FROM python:3.11-slim

WORKDIR /app

# Copy requirements and install dependencies
COPY backend/requirements.txt .
RUN pip install -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy main entry point
COPY main.py .

# Expose port
EXPOSE 8000

# Start the application
CMD ["python", "main.py"]
