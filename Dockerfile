FROM python:3.11-slim

WORKDIR /app

# Force fresh build - Railway cache bust

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy main entry point
COPY app.py .

# Expose port
EXPOSE 8000

# Start the application
CMD ["python", "app.py"]
