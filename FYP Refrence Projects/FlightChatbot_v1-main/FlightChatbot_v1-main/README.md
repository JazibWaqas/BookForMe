# 📌 WhatsApp Flight Booking Bot

A conversational WhatsApp bot that allows users to search for the cheapest flights using natural language. The bot is built with Flask and integrates with the Twilio Messaging API for WhatsApp, the Aviation Stack API for real-time flight data, and the Hugging Face API for advanced natural language understanding. It offers both a guided, step-by-step conversation and the ability to process a complete flight request in a single message.

-----

## ✨ Features

  - **Conversational Interface**: Interact with the bot on WhatsApp using natural language.
  - **Flight Search**: Find the cheapest flights from a specified departure city to a destination.
  - **AI-Powered NLU**: Leverages the Hugging Face API to understand complex queries and extract flight details like cities and passenger counts.
  - **Step-by-Step Guidance**: Guides users through the booking process if a full request isn't provided.
  - **City & Airport Matching**: Intelligent matching of city names to their corresponding IATA airport codes, including fuzzy matching for common misspellings or aliases.
  - **Real-Time Data & Mock Fallback**: Fetches live flight data from the Aviation Stack API with a built-in mock data generator for reliability in case of API failures.
  - **Booking Links**: Provides direct links to major booking sites (Skyscanner, Kayak, Expedia) for easy booking.
  - **Health Check & Home Endpoints**: Includes `/health` and `/` endpoints for monitoring the application status.

-----

## 🛠️ Tech Stack

  - **Python**: The core programming language.
  - **Flask**: A micro web framework for building the application.
  - **Twilio**: The API for sending and receiving messages on WhatsApp.
  - **Aviation Stack**: The API for fetching real-time flight data.
  - **Hugging Face (DialoGPT-large)**: An AI model used for natural language understanding and context-aware responses.
  - **Geopy**: A Python library to geocode addresses into coordinates (though its usage in the provided code is limited).
  - **python-dotenv**: To manage environment variables securely.
  - **Requests**: An HTTP library for making API calls.
  - **Regex (`re`)**: For pattern-based extraction of flight details.

-----

## 📁 Folder Structure

```
project-root/
├── .env
├── main.py
└── README.md
```

-----

## 🚀 How to Run

### 1\. Clone the Repository

```bash
git clone https://github.com/username/repo-name
cd repo-name
```

### 2\. Set Up Environment Variables

Create a `.env` file in the root directory and populate it with your API keys and credentials.

```
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=whatsapp:+14155238886
AVIATION_STACK_API_KEY=your_aviation_stack_api_key
HUGGINGFACE_API_KEY=your_hugging_face_api_key  # Optional
```

### 3\. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4\. Run the Application

```bash
python main.py
```

### 5\. Configure Twilio Webhook

  - The application will run on `http://localhost:5000`. To expose this to the internet, you'll need a tunneling service like **ngrok** or **Cloudflare Tunnel**.

<!-- end list -->

```bash
ngrok http 5000
```

  - Copy the `https://` URL provided by ngrok.
  - In your **Twilio Console**, navigate to **Develop \> Messaging \> Senders \> WhatsApp Senders**.
  - Find your Twilio WhatsApp number and paste the ngrok URL followed by `/webhook` into the `A MESSAGE COMES IN` field. For example: `https://your-ngrok-url.ngrok.io/webhook`.

You can now send a WhatsApp message to your Twilio number to start interacting with the bot\!

-----

## 🎥 Demo

![Demo GIF](demo/demo.gif)

-----

## 👤 Author

**Fahad Ali**

  - GitHub: [@FAHAD-ALI-github](https://github.com/FAHAD-ALI-github)
  - LinkedIn: [fahadali1078](https://www.linkedin.com/in/fahadali1078/)
