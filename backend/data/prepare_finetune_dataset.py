"""
Intent Detection Dataset Preparation for Qwen Fine-tuning
Converts JSONL dataset to various formats for fine-tuning
"""

import json
import random
from pathlib import Path
from collections import Counter

DATASET_PATH = Path(__file__).parent / "intent_dataset_extended.jsonl"
OUTPUT_DIR = Path(__file__).parent / "finetune_ready"

INTENTS = [
    "greeting",
    "booking_request", 
    "availability_inquiry",
    "service_selection",
    "date_selection",
    "time_selection",
    "price_inquiry",
    "confirmation",
    "cancellation",
    "modification",
    "information",
    "payment_related",
    "name_provided",
    "unknown"
]

SYSTEM_PROMPT = """You are an intent classifier for a WhatsApp booking assistant for sports facilities (padel, futsal, cricket) and salons in Karachi, Pakistan. 

Classify the user's message into one of these intents:
- greeting: Simple greetings like "Hi", "Aoa", "Salam"
- booking_request: User wants to book a slot
- availability_inquiry: User asking about available slots
- service_selection: User selecting a service type (padel, futsal, etc.)
- date_selection: User providing/selecting a date
- time_selection: User providing/selecting a time
- price_inquiry: User asking about pricing/charges
- confirmation: User confirming a booking
- cancellation: User canceling a booking
- modification: User wanting to change booking details
- information: User asking general questions
- payment_related: User discussing payment
- name_provided: User sharing their name
- unknown: Unclear or irrelevant message

The user may speak in Roman Urdu (Urdu written in English) mixed with English.

Respond with ONLY the intent label, nothing else."""


def load_dataset():
    data = []
    with open(DATASET_PATH, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                data.append(json.loads(line))
    return data


def get_stats(data):
    intent_counts = Counter(item["intent"] for item in data)
    print("\n=== Dataset Statistics ===")
    print(f"Total samples: {len(data)}")
    print("\nIntent distribution:")
    for intent in INTENTS:
        count = intent_counts.get(intent, 0)
        pct = (count / len(data)) * 100
        print(f"  {intent}: {count} ({pct:.1f}%)")
    return intent_counts


def convert_to_chat_format(data):
    formatted = []
    for item in data:
        formatted.append({
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": item["text"]},
                {"role": "assistant", "content": item["intent"]}
            ]
        })
    return formatted


def convert_to_alpaca_format(data):
    formatted = []
    for item in data:
        formatted.append({
            "instruction": SYSTEM_PROMPT,
            "input": item["text"],
            "output": item["intent"]
        })
    return formatted


def convert_to_simple_format(data):
    formatted = []
    for item in data:
        formatted.append({
            "prompt": f"Classify the intent of this message: \"{item['text']}\"\n\nIntent:",
            "completion": f" {item['intent']}"
        })
    return formatted


def split_dataset(data, train_ratio=0.8, val_ratio=0.1):
    random.seed(42)
    shuffled = data.copy()
    random.shuffle(shuffled)
    
    n = len(shuffled)
    train_end = int(n * train_ratio)
    val_end = int(n * (train_ratio + val_ratio))
    
    return {
        "train": shuffled[:train_end],
        "validation": shuffled[train_end:val_end],
        "test": shuffled[val_end:]
    }


def save_datasets(data, output_dir, format_name, converter_fn):
    output_dir.mkdir(parents=True, exist_ok=True)
    
    splits = split_dataset(data)
    
    for split_name, split_data in splits.items():
        converted = converter_fn(split_data)
        output_path = output_dir / f"{format_name}_{split_name}.jsonl"
        
        with open(output_path, "w", encoding="utf-8") as f:
            for item in converted:
                f.write(json.dumps(item, ensure_ascii=False) + "\n")
        
        print(f"Saved {len(converted)} samples to {output_path}")


def main():
    print("Loading dataset...")
    data = load_dataset()
    
    get_stats(data)
    
    print("\n=== Converting to fine-tuning formats ===")
    
    print("\n1. Chat format (OpenAI/Qwen compatible):")
    save_datasets(data, OUTPUT_DIR, "chat", convert_to_chat_format)
    
    print("\n2. Alpaca format:")
    save_datasets(data, OUTPUT_DIR, "alpaca", convert_to_alpaca_format)
    
    print("\n3. Simple prompt-completion format:")
    save_datasets(data, OUTPUT_DIR, "simple", convert_to_simple_format)
    
    all_chat = convert_to_chat_format(data)
    with open(OUTPUT_DIR / "chat_all.jsonl", "w", encoding="utf-8") as f:
        for item in all_chat:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")
    print(f"\nSaved complete dataset to {OUTPUT_DIR / 'chat_all.jsonl'}")
    
    print("\n=== Done! ===")
    print(f"Output directory: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
