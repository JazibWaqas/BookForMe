"""
Merge all intent detection datasets into a single file
"""

import json
from pathlib import Path
from collections import Counter

DATA_DIR = Path(__file__).parent

FILES = [
    "intent_dataset.jsonl",
    "intent_dataset_extended.jsonl", 
    "intent_dataset_realistic.jsonl"
]


def load_jsonl(filepath):
    data = []
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                data.append(json.loads(line))
    return data


def normalize_entry(entry):
    text = entry.get("text", "").strip()
    intent = entry.get("intent", "unknown").strip().lower()
    return {"text": text, "intent": intent}


def merge_all():
    seen = set()
    merged = []
    duplicates = 0
    
    for filename in FILES:
        filepath = DATA_DIR / filename
        if not filepath.exists():
            print(f"Warning: {filename} not found, skipping...")
            continue
            
        data = load_jsonl(filepath)
        print(f"Loaded {len(data)} entries from {filename}")
        
        for entry in data:
            normalized = normalize_entry(entry)
            key = normalized["text"].lower()
            
            if key and key not in seen:
                seen.add(key)
                merged.append(normalized)
            else:
                duplicates += 1
    
    print(f"\nTotal merged: {len(merged)} unique entries")
    print(f"Duplicates removed: {duplicates}")
    
    return merged


def analyze_dataset(data):
    print("\n=== Dataset Analysis ===")
    
    intent_counts = Counter(item["intent"] for item in data)
    
    print(f"\nTotal samples: {len(data)}")
    print("\nIntent distribution:")
    for intent, count in sorted(intent_counts.items(), key=lambda x: -x[1]):
        pct = (count / len(data)) * 100
        bar = "#" * int(pct / 2)
        print(f"  {intent:20s}: {count:4d} ({pct:5.1f}%) {bar}")
    
    print("\n=== Language Analysis ===")
    urdu_indicators = ["aoa", "salam", "kal", "aaj", "shaam", "raat", "subah", "hai", "hei", "ho", "karo", "chahiye", "btao", "krdo", "krna"]
    urdu_count = 0
    mixed_count = 0
    english_count = 0
    
    for item in data:
        text = item["text"].lower()
        has_urdu = any(ind in text for ind in urdu_indicators)
        has_english = any(c.isalpha() and ord(c) < 128 for c in text)
        
        if has_urdu and has_english:
            mixed_count += 1
        elif has_urdu:
            urdu_count += 1
        else:
            english_count += 1
    
    print(f"  Roman Urdu: {urdu_count}")
    print(f"  English: {english_count}")
    print(f"  Mixed: {mixed_count}")
    
    return intent_counts


def main():
    merged = merge_all()
    analyze_dataset(merged)
    
    output_path = DATA_DIR / "intent_dataset_merged.jsonl"
    with open(output_path, "w", encoding="utf-8") as f:
        for item in merged:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")
    
    print(f"\nSaved merged dataset to: {output_path}")
    
    csv_path = DATA_DIR / "intent_dataset_merged.csv"
    with open(csv_path, "w", encoding="utf-8") as f:
        f.write("text,intent\n")
        for item in merged:
            text = item["text"].replace('"', '""')
            f.write(f'"{text}",{item["intent"]}\n')
    
    print(f"Saved CSV version to: {csv_path}")


if __name__ == "__main__":
    main()
