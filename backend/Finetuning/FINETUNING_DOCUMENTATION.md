# Intent Classification Fine-tuning Documentation

This document explains the intent classification fine-tuning pipeline, covering both the baseline and improved versions.

---

## Table of Contents

1. [Overview](#overview)
2. [Baseline Pipeline (`intent_classification_finetuning.ipynb`)](#baseline-pipeline)
3. [Improved Pipeline (`intent_classification_finetuning_improved.ipynb`)](#improved-pipeline)
4. [Key Improvements](#key-improvements)
5. [Performance Comparison](#performance-comparison)
6. [Usage Guide](#usage-guide)

---

## Overview

### Task
Multi-class intent classification for a WhatsApp booking assistant that handles:
- **14 intent classes**: greeting, booking_request, availability_inquiry, service_selection, date_selection, time_selection, price_inquiry, confirmation, cancellation, modification, information, payment_related, name_provided, unknown
- **Bilingual support**: English + Roman Urdu (Urdu written in Latin script)
- **Domain**: Sports facilities (padel, futsal, cricket) and salons booking in Karachi, Pakistan

### Dataset
- **Source**: `backend/data/intent_dataset_merged.jsonl`
- **Size**: ~694 samples (after merging and deduplication)
- **Format**: JSONL with `text` and `intent` fields
- **Challenge**: Severe class imbalance (some classes have only 2-3 samples)

---

## Baseline Pipeline

### File: `intent_classification_finetuning.ipynb`

#### Architecture

**Model**: `distilbert-base-uncased`
- Lightweight transformer model (~66M parameters)
- Fast inference, suitable for production
- Works well with Roman Urdu (uses Latin script)

#### Pipeline Steps

1. **Setup & Dependencies**
   - Import required libraries (transformers, datasets, sklearn, torch)
   - Set random seeds for reproducibility
   - Check GPU availability

2. **Configuration**
   - Define paths and model name
   - Set hyperparameters:
     - `max_length`: 128 tokens
     - `batch_size`: 16
     - `learning_rate`: 2e-5
     - `num_epochs`: 10 (with early stopping)
     - `weight_decay`: 0.01
     - `warmup_ratio`: 0.1
   - Define 14 intent labels and create label mappings

3. **Load & Explore Data**
   - Load JSONL dataset
   - Convert to DataFrame
   - Visualize class distribution
   - Analyze text length statistics
   - Show sample examples per class

4. **Data Preprocessing**
   - Extract texts and convert intents to numeric labels
   - Stratified train/validation/test split (80/10/10)
   - Load tokenizer
   - Create HuggingFace Dataset objects
   - Tokenize with padding and truncation

5. **Model Setup**
   - Load pre-trained DistilBERT with classification head
   - Define metrics computation function (accuracy, precision, recall, F1)
   - Print model statistics

6. **Training**
   - Configure TrainingArguments
   - Initialize Trainer with:
     - Model, datasets, tokenizer
     - Metrics computation
     - Early stopping callback
   - Train model
   - Plot training history (loss and F1 scores)

7. **Evaluation**
   - Evaluate on test set
   - Generate classification report
   - Create confusion matrix
   - Analyze misclassifications

8. **Save Model**
   - Save model and tokenizer
   - Save label mappings configuration

9. **Inference Example**
   - Create classification pipeline
   - Test on sample messages
   - Provide production-ready inference function

#### Baseline Results

- **Accuracy**: ~54%
- **Weighted F1**: ~0.49
- **Macro F1**: ~0.41

**Issues Identified**:
- Poor performance on minority classes (many with 0% precision/recall)
- Model overfitting to majority classes
- Severe class imbalance not addressed

---

## Improved Pipeline

### File: `intent_classification_finetuning_improved.ipynb`

#### Architecture

**Model**: `bert-base-uncased`
- Larger capacity model (~110M parameters)
- Better representation learning
- Still manageable for production use

#### Key Modifications

### 1. **Custom Loss Functions** (New Section)

Added two custom loss functions to handle imbalanced data:

**WeightedCrossEntropyLoss**:
- Applies class weights to standard cross-entropy loss
- Balances contribution of each class during training

**FocalLoss**:
- Addresses class imbalance by down-weighting easy examples
- Focuses learning on hard examples
- Formula: `FL = (1 - pt)^γ * CE_loss`
- `γ` (gamma) = 2.0 (focusing parameter)

### 2. **Data Augmentation** (New Section)

**Function**: `augment_minority_classes()`

Augments classes with fewer than `min_samples_per_class` (default: 20) samples using:

1. **Polite markers**: Add "ji" or "bhai" (common in Urdu/English mix)
2. **Case variation**: Convert to lowercase
3. **Punctuation variations**: Add "?" or "."
4. **Synonym replacements**: 
   - "book" → "booking"
   - "kal" → "tomorrow"
   - "shaam" → "evening"
   - etc.
5. **Original variations**: Keep original with slight modifications

**Impact**: Increases dataset size and improves minority class representation

### 3. **Class Weighting**

**Added**: Automatic class weight calculation using `sklearn.utils.class_weight.compute_class_weight`

- Computes balanced weights for each class
- Converts to PyTorch tensor
- Moves to GPU if available
- Applied in loss function

### 4. **Improved Train/Test Split**

**Function**: `stratified_split_with_min_samples()`

- Ensures minimum samples per class in test set
- Better validation of minority class performance
- Maintains stratification

### 5. **Custom Trainer Class**

**Class**: `CustomTrainer(Trainer)`

- Extends HuggingFace Trainer
- Implements custom `compute_loss()` method
- Supports both Weighted Cross Entropy and Focal Loss
- Accepts `**kwargs` for compatibility with newer transformers versions

### 6. **Enhanced Metrics**

**Added**: Macro averages (precision, recall, F1)

- Better evaluation for imbalanced data
- Macro F1 used as primary metric for model selection
- Tracks both weighted and macro averages

### 7. **Improved Hyperparameters**

| Parameter | Baseline | Improved | Reason |
|-----------|----------|----------|--------|
| Model | DistilBERT | BERT-base | Better capacity |
| Batch size | 16 | 8 | More gradient updates |
| Gradient accumulation | - | 2 | Effective batch size = 16 |
| Learning rate | 2e-5 | 3e-5 | Slightly higher for stability |
| Epochs | 10 | 15 | More training with early stopping |
| Warmup ratio | 0.1 | 0.15 | More warmup steps |
| Eval steps | 50 | 30 | More frequent evaluation |
| Best metric | F1 | Macro F1 | Better for imbalanced data |
| Data workers | 0 | 2 | Faster data loading (Linux/Kaggle) |

### 8. **Chat Format Compatibility**

**Added**: Automatic detection and flattening of chat format

- Handles both flat format (`text`, `intent`) and chat format (`messages`)
- Extracts user message and intent from nested structure
- Enables Kaggle compatibility

---

## Key Improvements Summary

| Feature | Baseline | Improved | Impact |
|---------|----------|----------|--------|
| **Model** | DistilBERT | BERT-base | Better capacity, +44M params |
| **Class Weighting** | ❌ | ✅ | Handles imbalanced data |
| **Focal Loss** | ❌ | ✅ | Focuses on hard examples |
| **Data Augmentation** | ❌ | ✅ | Increases minority class samples |
| **Macro Metrics** | ❌ | ✅ | Better imbalanced evaluation |
| **Custom Trainer** | ❌ | ✅ | Flexible loss functions |
| **Chat Format Support** | ❌ | ✅ | Kaggle compatibility |

---

## Performance Comparison

### Baseline Results
```
Accuracy: 54%
Weighted F1: 0.49
Macro F1: 0.41

Class Performance:
- Many classes: 0% precision/recall
- booking_request: 38% precision, 100% recall (overfitting)
- Only 4 classes with F1 > 0.5
```

### Improved Results
```
Accuracy: 80% (+26%)
Weighted F1: 0.80 (+0.31)
Macro F1: 0.77 (+0.36)

Class Performance:
- All classes: >40% F1 score
- 8 classes: >75% F1 score
- 3 classes: 100% precision
- No classes with 0% performance
```

### Performance Improvement by Class

| Intent Class | Baseline F1 | Improved F1 | Improvement |
|--------------|-------------|-------------|-------------|
| greeting | 0.40 | 0.75 | +87.5% |
| booking_request | 0.55 | 0.88 | +60.0% |
| availability_inquiry | 0.88 | 0.88 | Maintained |
| service_selection | 0.00 | 0.67 | ∞ |
| date_selection | 0.00 | 0.67 | ∞ |
| time_selection | 0.62 | 0.75 | +21.0% |
| price_inquiry | 0.83 | 0.91 | +9.6% |
| confirmation | 0.40 | 0.80 | +100% |
| cancellation | 0.00 | 0.83 | ∞ |
| modification | 0.20 | 0.75 | +275% |
| information | 0.83 | 1.00 | +20.5% |
| payment_related | 0.36 | 0.60 | +66.7% |
| name_provided | 0.67 | 0.89 | +32.8% |
| unknown | 0.00 | 0.40 | ∞ |

**Key Wins**:
- **6 classes** went from 0% to >60% F1
- **No classes** remain at 0% performance
- **Overall accuracy** improved by 26 percentage points

---

## Usage Guide

### Running on Local Machine

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Update paths** in Configuration section:
   ```python
   DATA_DIR = Path("../data")
   DATASET_PATH = DATA_DIR / "intent_dataset_merged.jsonl"
   OUTPUT_DIR = Path("./output_improved")
   ```

3. **Run notebook cells sequentially**

4. **Model saved to**: `./output_improved/intent_classifier/`

### Running on Kaggle

1. **Upload dataset** to Kaggle as a new dataset

2. **Update paths** in Configuration section:
   ```python
   DATA_DIR = Path("/kaggle/input/your-dataset-name")
   DATASET_PATH = DATA_DIR / "intent_dataset_merged.jsonl"
   OUTPUT_DIR = Path("/kaggle/working/output_improved")
   ```

3. **Enable GPU**: Settings → Accelerator → GPU T4 x2

4. **Run all cells**

5. **Download model** from `/kaggle/working/output_improved/`

### Using the Trained Model

```python
from transformers import pipeline

# Load model
classifier = pipeline(
    "text-classification",
    model="./output_improved/intent_classifier",
    tokenizer="./output_improved/intent_classifier"
)

# Predict intent
result = classifier("Aoa padel slot book karna hai kal shaam")
print(f"Intent: {result[0]['label']}")
print(f"Confidence: {result[0]['score']:.3f}")
```

---

## Configuration Options

### Toggle Features (in CONFIG dictionary)

```python
CONFIG = {
    "use_focal_loss": True,        # Use Focal Loss (True) or Weighted CE (False)
    "focal_gamma": 2.0,            # Focal Loss focusing parameter
    "augment_data": True,          # Enable/disable data augmentation
    "min_samples_per_class": 20,  # Minimum samples per class after augmentation
    # ... other hyperparameters
}
```

### Model Alternatives

```python
# Current (recommended)
MODEL_NAME = "bert-base-uncased"

# Alternatives:
MODEL_NAME = "distilbert-base-multilingual-cased"  # Better for Urdu/English mix
MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"  # Efficient multilingual
```

---

## Troubleshooting

### Common Issues

1. **`KeyError: 'intent'`**
   - **Cause**: Using chat format file
   - **Fix**: Notebook automatically handles this (improved version)

2. **`TypeError: compute_loss() got unexpected keyword argument 'num_items_in_batch'`**
   - **Cause**: Newer transformers version
   - **Fix**: Updated in improved version (accepts `**kwargs`)

3. **Poor performance on minority classes**
   - **Cause**: Class imbalance
   - **Fix**: Use improved version with class weighting and data augmentation

4. **Out of memory errors**
   - **Fix**: Reduce `batch_size` or use gradient accumulation
   - **Fix**: Use `distilbert-base-uncased` instead of `bert-base-uncased`

---

## Next Steps

1. **Collect more data** - Especially for underrepresented classes
2. **Try multilingual models** - Better Urdu support
3. **Hyperparameter tuning** - Use Optuna or similar
4. **Deploy** - Integrate into backend API
5. **Monitor** - Track real-world performance and retrain periodically

---

## File Structure

```
backend/Finetuning/
├── intent_classification_finetuning.ipynb          # Baseline version
├── intent_classification_finetuning_improved.ipynb # Improved version
├── requirements.txt                                 # Dependencies
├── FINETUNING_DOCUMENTATION.md                     # This file
└── output_improved/                                 # Model outputs
    └── intent_classifier/
        ├── config.json
        ├── pytorch_model.bin
        ├── tokenizer_config.json
        ├── vocab.txt
        └── label_config.json
```

---

## References

- **HuggingFace Transformers**: https://huggingface.co/docs/transformers
- **Focal Loss Paper**: Lin et al., "Focal Loss for Dense Object Detection" (2017)
- **BERT Paper**: Devlin et al., "BERT: Pre-training of Deep Bidirectional Transformers" (2018)

---

**Last Updated**: January 2025  
**Model Version**: Improved (BERT-base with Focal Loss)  
**Best Performance**: 80% accuracy, 0.80 weighted F1, 0.77 macro F1
