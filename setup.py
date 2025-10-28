from setuptools import setup, find_packages

setup(
    name="bookforme-backend",
    version="1.0.0",
    description="BookForMe WhatsApp Booking Bot Backend",
    packages=find_packages(),
    install_requires=[
        "fastapi>=0.104.0",
        "uvicorn[standard]>=0.24.0",
        "python-multipart>=0.0.6",
        "google-generativeai>=0.3.0",
        "requests>=2.31.0",
        "google-cloud-firestore>=2.13.0",
        "google-auth>=2.23.0",
        "python-dotenv>=1.0.0",
        "pydantic>=2.4.0",
        "pydantic-settings>=2.0.0",
    ],
    python_requires=">=3.8",
)
