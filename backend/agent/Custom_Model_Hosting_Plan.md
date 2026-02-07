Implementation Plan: Custom Model Hosting & Integration
1. Goal
Replace the current LLM-based intent classification with a custom-trained BERT model (trained on 5 intents) to improve speed, cost-efficiency, and consistency.

2. Proposed Hosting Architecture
We will use a FastAPI + Docker approach hosted on a VPS (e.g., DigitalOcean, Hetzner, or AWS EC2). This is the best balance of cost and control.

Option A: Manual VPS Deployment (Recommended for Cost)
Inference API: A simple FastAPI service that loads the model once and serves requests.
Docker: Containerize the service for easy deployment anywhere.
Reverse Proxy: Use Nginx or Traefik with Let's Encrypt for HTTPS.
Option B: Hugging Face Inference Endpoints (Easiest)
If you upload your model to Hugging Face, you can deploy it as a "Managed Endpoint" with one click. This provides an API URL immediately.

3. Proposed Changes
[NEW] Inference Service (Independent Repo or Subdir)
Create a standalone service to host the model.

inference_api/main.py
python
from fastapi import FastAPI
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
app = FastAPI()
tokenizer = AutoTokenizer.from_pretrained("./model")
model = AutoModelForSequenceClassification.from_pretrained("./model")
INTENT_MAP = {0: "greeting", 1: "inquiry", 2: "info_request", 3: "transaction", 4: "unknown"}
@app.post("/predict")
async def predict(text: str):
    inputs = tokenizer(text, return_tensors="pt")
    with torch.no_grad():
        logits = model(**inputs).logits
    idx = torch.argmax(logits, dim=1).item()
    return {"intent": INTENT_MAP[idx], "confidence": torch.softmax(logits, dim=1)[0][idx].item()}
inference_api/Dockerfile
dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install torch transformers fastapi uvicorn
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
[MODIFY] 
agent.py
We will add a new method extract_intent_custom that calls your hosted API.

python
async def extract_intent_custom(self, message: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{self.model_api_url}/predict", params={"text": message})
        return response.json()
4. Verification Plan
Automated Tests
Unit Test for Inference API:
Run inference_api locally.
Send request: "Hi" -> Expect GREETING.
Send request: "Kal slot hai?" -> Expect INQUIRY.
Integration Test:
Update 
.env
 with CUSTOM_MODEL_URL.
Run 
backend/quick_test.py
 to see if the new classification works.
Manual Verification
Deployment Check:
Hit the hosted URL /docs in the browser to ensure FastAPI is alive.
Test via cURL: curl -X POST "https://your-api.com/predict?text=hello"
End-to-End Chat:
Use the Web Chat UI to send a message and check backend logs for Using custom model for classification.
IMPORTANT

Since the custom model only handles Intent, we still need the LLM for Entity Extraction (Date, Time, Service) if the model doesn't provide them. I suggest a "Hybrid Approach" where the custom model identifies the intent, and if it's INQUIRY, we call the LLM specifically for entities.