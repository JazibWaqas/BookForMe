FROM python:3.11-slim

WORKDIR /app

# Force fresh build

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy main entry point
COPY main.py .

# Expose port
EXPOSE 8000

# Start the application
CMD ["python", "main.py"]
