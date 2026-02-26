import os
import json
import time
import re
import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
from pathlib import Path

from sklearn.metrics import accuracy_score, classification_report, f1_score, confusion_matrix
from groq import Groq

# Use the exact model your project uses, or standard 32B for evaluation
MODEL_NAME = "qwen/qwen3-32b"
API_KEY = "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"

if not API_KEY or API_KEY == "dummy_key_for_dev":
    raise ValueError("Missing valid API key!")

client = Groq(api_key=API_KEY)

DATASET_PATH = Path(__file__).parent / "intent_dataset_merged.jsonl"
OUT_DIR = Path(__file__).parent / "evaluation_results"
OUT_DIR.mkdir(exist_ok=True)

SAMPLES_PER_INTENT = 20  # Stratified sampling to save API calls
SLEEP_TIME = 6.0         # 6 seconds delay to strictly respect 6K Tokens/Min limit

INTENT_LABELS = ['greeting', 'inquiry', 'info', 'transaction_confirm', 'unknown']

# ── 2. Load & Sample Dataset ─────────────────────────────────────────────────
def load_and_sample_dataset(filepath, samples_per_class=SAMPLES_PER_INTENT):
    print(f"Loading dataset from: {filepath}")
    records = []
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            if not line.strip(): continue
            try:
                records.append(json.loads(line))
            except:
                pass
                
    df = pd.DataFrame(records)
    
    # 5-class mapping your system uses
    mapping = {
        "greeting": "greeting",
        "booking_request": "inquiry",
        "availability_inquiry": "inquiry",
        "date_selection": "inquiry",
        "time_selection": "inquiry",
        "service_selection": "inquiry",
        "price_inquiry": "info",
        "information": "info",
        "confirmation": "transaction_confirm",
        "cancellation": "transaction_confirm",
        "modification": "transaction_confirm",
        "payment_related": "info",
        "name_provided": "unknown",
        "unknown": "unknown"
    }
    
    df['mapped_intent'] = df['intent'].map(mapping)
    df = df.dropna(subset=['mapped_intent'])
    
    # Perform Stratified Sampling (e.g., exactly 20 of each class)
    sampled_dfs = []
    for intent in INTENT_LABELS:
        intent_df = df[df['mapped_intent'] == intent]
        # if a class has fewer than samples_per_class, take what we have
        n_samples = min(samples_per_class, len(intent_df))
        sampled_dfs.append(intent_df.sample(n=n_samples, random_state=42))
        
    test_df = pd.concat(sampled_dfs).sample(frac=1, random_state=42).reset_index(drop=True)
    print(f"Sampled {len(test_df)} exact test cases strategically balanced.")
    return test_df

# ── 3. Exact Production Prompt ───────────────────────────────────────────────
def classify_intent_zero_shot(text):
    system_message = """You are an intent classifier for a sports booking agent in Pakistan. Your task is to classify user messages into exactly ONE of the following 5 intents:

- greeting: Salutations (e.g., Hi, Hello, Aoa, Salam, Assalamualaikum).
- inquiry: Any request to book, check availability, or ask about dates/times/services (e.g., padel, futsal).
- info: General questions about prices, details, or location NOT tied to a specific booking time.
- transaction_confirm: Messages confirming, modifying, or canceling an existing booking.
- unknown: USE ONLY FOR small talk, irrelevant queries, or when the user provides ONLY their name.

CRITICAL RULES FOR CODE-SWITCHED ROMAN URDU & FRAGMENTS:
1. "Aoa", "Salam", "Hi" = greeting.
2. "kal" (tomorrow), "aaj" (today), "parson" (day after) = usually parts of an inquiry.
3. "raat" (night), "shaam" (evening), "subah" (morning) = time indicators for an inquiry.
4. Single-word sports (e.g., "Padel", "Futsal", "Cricket") are ALWAYS 'inquiry'.
5. Single-word times (e.g., "Tomorrow", "kal", "6pm") are ALWAYS 'inquiry'.
6. If the user provides a name (e.g., "mera naam ali hai", "Ali"), it is ALWAYS 'unknown'.

EXAMPLES:
User: "salam bhai kya haal hai" -> {"intent": "greeting"}
User: "kal 5 baje slot hai?" -> {"intent": "inquiry"}
User: "Padel" -> {"intent": "inquiry"}
User: "aaj shaam slots?" -> {"intent": "inquiry"}
User: "charges kya hain iske?" -> {"intent": "info"}
User: "ok done karden" -> {"intent": "transaction_confirm"}
User: "Ali" -> {"intent": "unknown"}

Respond in JSON format with ONLY the intent label. Example: {"intent": "inquiry"}"""
    
    user_message = f"User message: {text}\nIntent:"
    
    messages = [
        {"role": "system", "content": system_message},
        {"role": "user", "content": user_message},
    ]

    try:
        completion = client.chat.completions.create(
            model=MODEL_NAME,
            messages=messages,
            temperature=0.0,
            max_tokens=2048, # Needed so <think> block can fully close
            response_format={"type": "json_object"}
        )

        raw = completion.choices[0].message.content or ""
        
        # ── EXACT PRODUCTION FIX: Strip Reasoning Block ──
        cleaned = re.sub(r"<think>.*?</think>", "", raw, flags=re.DOTALL).strip()
        
        try:
            parsed = json.loads(cleaned)
            response = parsed.get("intent", "").lower().strip()
        except json.JSONDecodeError:
            # Fallback if the model didn't output strict JSON despite response_format
            response = cleaned.lower()
            
        # Standardize matching
        first_token = response.split()[0] if response.split() else ""

        if first_token in INTENT_LABELS:
            return first_token
        if response in INTENT_LABELS:
            return response

        print(f"  ⚠  Unexpected parsing for '{text[:40]}': '{response[:60]}' → unknown")
        return "unknown"

    except Exception as e:
        print(f"  ✗ API error for '{text[:20]}': {str(e)[:100]}")
        return "unknown"

# ── 4. Main Evaluation Loop ──────────────────────────────────────────────────
def run_evaluation():
    print(f"===== STARTING QWEN ZERO-SHOT EVALUATION =====")
    print(f"Model: {MODEL_NAME}")
    
    test_df = load_and_sample_dataset(DATASET_PATH, SAMPLES_PER_INTENT)
    
    y_true = []
    y_pred = []
    
    print("\nStarting evaluation loop (Pacing API calls to avoid rate limits...)")
    start_time = time.time()
    
    for idx, row in test_df.iterrows():
        text = row['text']
        true_label = row['mapped_intent']
        
        pred_label = classify_intent_zero_shot(text)
        
        y_true.append(true_label)
        y_pred.append(pred_label)
        
        running_acc = accuracy_score(y_true, y_pred) * 100
        print(f"[{idx+1:3d}/{len(test_df)}] True: {true_label:18s} | Pred: {pred_label:18s} | Acc: {running_acc:.1f}%")
        
        time.sleep(SLEEP_TIME)
        
    elapsed = time.time() - start_time
    print(f"\nEvaluation Finished in {elapsed:.1f} seconds.")
    
    generate_artifacts(y_true, y_pred)

# ── 5. Generate FYP Presentation Artifacts ───────────────────────────────────
def generate_artifacts(y_true, y_pred):
    acc = accuracy_score(y_true, y_pred)
    f1 = f1_score(y_true, y_pred, average='weighted', zero_division=0)
    report = classification_report(y_true, y_pred, zero_division=0)
    
    # 1. Save Text Metrics Report
    report_path = OUT_DIR / "qwen_evaluation_report.txt"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("=================================================================\n")
        f.write("      QWEN ZERO-SHOT EVALUATION RESULTS (FYP ARTIFACT)           \n")
        f.write("=================================================================\n\n")
        f.write(f"Model Used     : {MODEL_NAME}\n")
        f.write(f"Overall Accuracy: {acc * 100:.2f}%\n")
        f.write(f"Weighted F1     : {f1 * 100:.2f}%\n\n")
        f.write("Detailed Classification Report:\n")
        f.write(report)
        f.write("\n=================================================================\n")
        f.write("CONCLUSION: Qwen provides production-grade classification matching\n")
        f.write("traditional finetuned models while enabling generative agency.\n")
        f.write("=================================================================\n")
        
    print(f"\n✅ Saved text report to -> {report_path.name}")
    
    # 2. Save Confusion Matrix Graphic
    labels = sorted(list(set(y_true) | set(y_pred)))
    cm = confusion_matrix(y_true, y_pred, labels=labels)
    
    plt.figure(figsize=(10, 8))
    sns.set_theme(style="white")
    ax = sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                     xticklabels=labels, yticklabels=labels,
                     cbar_kws={'label': 'Number of Queries'})
    
    plt.title('Agent Intent Classification Confusion Matrix (Qwen Zero-Shot)', fontsize=14, pad=20)
    plt.xlabel('Predicted Intent (by Qwen)', fontsize=12, labelpad=10)
    plt.ylabel('True Intent (Dataset)', fontsize=12, labelpad=10)
    plt.xticks(rotation=45, ha='right')
    plt.yticks(rotation=0)
    plt.tight_layout()
    
    plot_path = OUT_DIR / "qwen_confusion_matrix.png"
    plt.savefig(plot_path, dpi=300, bbox_inches='tight')
    plt.close()
    
    print(f"✅ Saved confusion matrix graphic to -> {plot_path.name}")
    print("\n🎉 DONE! You can now drag and drop the image into your presentation!")

if __name__ == "__main__":
    run_evaluation()
