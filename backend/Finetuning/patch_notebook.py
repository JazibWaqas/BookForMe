"""
Directly writes the correct classify_intent cell into the notebook.
"""
import json, re as re_mod

NB_PATH = r"c:/Users/OMNIBOOK/Documents/GitHub/JHAT/backend/Finetuning/qwen3-classifybookforme (1).ipynb"
KAGGLE_PATH = "/kaggle/input/datasets/taqikaaccount/intent-dataset-merged/intent_dataset_merged.jsonl"

FIXED_CLASSIFY_CELL = r'''def create_fewshot_prompt(text):
    examples = """
User message: Hi there!
Intent: greeting

User message: I'd like to book a table for two tomorrow at 7pm.
Intent: inquiry

User message: What are your prices for the deluxe package?
Intent: info

User message: Please confirm my booking #12345.
Intent: transaction_confirm

User message: My name is John.
Intent: unknown
"""
    return f"{examples}\nUser message: {text}\nIntent:"


def classify_intent(text, use_fewshot=True):
    try:
        if use_fewshot:
            user_content = create_fewshot_prompt(text)
            messages = [{"role": "user", "content": user_content}]
        else:
            system_message = """You are an intent classifier for a booking system. Your task is to classify user messages into exactly one of the following intents:

- greeting: Salutations, hellos, hi, good morning, etc.
- inquiry: Questions about booking, availability, dates, times, services.
- info: Requests for general information (prices, payment, details) not tied to a booking.
- transaction_confirm: Messages confirming, modifying, or canceling a booking.
- unknown: Anything that doesn't fit the above, including name providing, small talk, etc.

Respond with ONLY the intent label, nothing else. Do not add punctuation or explanation."""
            user_message = f"User message: {text}\nIntent:"
            messages = [
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message},
            ]

        completion = client.chat.completions.create(
            model=MODEL_NAME,
            messages=messages,
            temperature=0.0,
            max_tokens=2048,   # Must be large enough for <think> block to finish
        )

        raw = completion.choices[0].message.content or ""
        # ── KEY FIX: Qwen3 is a reasoning model that wraps every reply in
        #    <think>...</think> before the actual answer.  With max_tokens=10
        #    (the original value) the block never closes and we only ever see
        #    the opening tag → everything maps to "unknown".
        #    Strip it first, then grab the real label.
        cleaned = re.sub(r"<think>.*?</think>", "", raw, flags=re.DOTALL)
        response = cleaned.strip().lower()
        first_token = response.split()[0] if response.split() else ""

        if first_token in INTENT_LABELS:
            return first_token
        if response in INTENT_LABELS:
            return response

        print(f"Warning: Unexpected response: '{response[:80]}', mapping to unknown")
        return "unknown"

    except Exception as e:
        print(f"Error processing '{text}': {e}")
        return "unknown"'''

with open(NB_PATH, "r", encoding="utf-8") as f:
    nb = json.load(f)

fixes = []
for cell in nb["cells"]:
    if cell["cell_type"] != "code":
        continue
    src = cell["source"]

    # Fix dataset path
    if "DATASET_PATH" in src:
        fixed = re_mod.sub(
            r'DATASET_PATH\s*=\s*r?"[^"]*"',
            f'DATASET_PATH = "{KAGGLE_PATH}"',
            src,
        )
        if fixed != src:
            cell["source"] = fixed
            src = fixed
            fixes.append("dataset path restored to Kaggle")

    # Add import re to imports cell
    if "from groq import Groq" in src and "import re" not in src:
        cell["source"] = "import re\n" + src
        src = cell["source"]
        fixes.append("added import re")

    # Replace the entire classify_intent cell with the correct version
    if "def classify_intent" in src:
        cell["source"] = FIXED_CLASSIFY_CELL
        fixes.append("classify_intent fully replaced (max_tokens=2048 + <think> stripping)")

    # Clear stale outputs on the evaluation cell
    if "accuracy_score" in src and "classify_intent" in src:
        cell["outputs"] = []
        cell["execution_count"] = None
        fixes.append("stale eval outputs cleared")

with open(NB_PATH, "w", encoding="utf-8") as f:
    json.dump(nb, f, indent=1)

print("Fixes applied:")
for fix in fixes:
    print(f"  ✓ {fix}")
print("\n✅ Notebook is ready — upload to Kaggle and Run All.")
