# Python code to load one or more metrics JSON files and produce solo + comparative charts.
# Saves all plots into /mnt/data/metrics_plots and zips them for download.
# - It automatically finds JSON files in /mnt/data and the current working directory.
# - To add more metric files, place them in /mnt/data or the notebook working directory (or pass paths list below).
# - Comparative charts that create multiple subplots are arranged with up to 3 plots per row (as requested).
#
# Note: plots use matplotlib (no seaborn). Each saved image is a separate file. Running this cell will create a zip at /mnt/data/metrics_plots.zip.
# After running, download the zip: sandbox:/mnt/data/metrics_plots.zip

import os, json, glob, shutil, math
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

OUTPUT_DIR = "metrics_plots"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Optionally set explicit files to load here (leave empty to auto-detect)
explicit_files = []  # e.g. ['/mnt/data/bert_metrics.json', '/mnt/data/other_metrics.json']

# Auto-detect JSON files in /mnt/data and current directory if explicit_files empty
candidates = []
if explicit_files:
    candidates = explicit_files
else:
    candidates += glob.glob("/mnt/data/*.json")
    candidates += glob.glob("*.json")
# Deduplicate
candidates = sorted(list(dict.fromkeys(candidates)))

if not candidates:
    raise FileNotFoundError("No JSON metric files found in /mnt/data or current working directory. Place your metric JSON files there.")

def slugify(name):
    return "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in name).lower()

models = []
for fpath in candidates:
    try:
        with open(fpath, "r") as fh:
            data = json.load(fh)
        model_name = data.get("model_info", {}).get("name", Path(fpath).stem)
        dataset = data.get("model_info", {}).get("dataset", "")
        file_stem = Path(fpath).stem
        model_id = file_stem
        models.append({"path": fpath, "name": model_name, "dataset": dataset, "id": model_id, "metrics": data})
    except Exception as e:
        print(f"Skipped {fpath}: {e}")

if not models:
    raise RuntimeError("No valid metric JSON files loaded.")

# Helper to save figure
def save_fig(fig, out_path):
    fig.tight_layout()
    fig.savefig(out_path, dpi=150)
    plt.close(fig)
    return out_path

# Create solo charts for each model
for m in models:
    md = m["metrics"]
    mid = slugify(m["id"])
    model_out = os.path.join(OUTPUT_DIR, mid)
    os.makedirs(model_out, exist_ok=True)
    
    # 1) Global metrics bar chart (accuracy, macro_f1, weighted_f1)
    gm = md.get("global_metrics", {})
    keys = ["accuracy", "macro_f1", "weighted_f1"]
    values = [gm.get(k, np.nan) for k in keys]
    fig = plt.figure(figsize=(6,4))
    ax = fig.add_subplot(111)
    ax.bar(keys, values)
    ax.set_ylim(0,1.05)
    ax.set_title(f"{m['id']} - Global metrics")
    ax.set_ylabel("Score")
    for i,v in enumerate(values):
        ax.text(i, v + 0.02, f"{v:.3f}", ha="center", va="bottom")
    save_fig(fig, os.path.join(model_out, f"{mid}_global_metrics.png"))
    
    # 2) Log loss chart (single value)
    logloss = gm.get("log_loss", None) or md.get("ranking_metrics", {}).get("log_loss", None)
    if logloss is not None:
        fig = plt.figure(figsize=(4,4))
        ax = fig.add_subplot(111)
        ax.bar(["log_loss"], [logloss])
        ax.set_title(f"{m['id']} - Log loss (lower better)")
        ax.text(0, logloss + 0.02*max(1, logloss), f"{logloss:.4f}", ha="center", va="bottom")
        save_fig(fig, os.path.join(model_out, f"{mid}_log_loss.png"))
    
    # 3) Per-class precision/recall/f1 grouped bar chart
    pcm = md.get("per_class_metrics", {})
    labels = list(pcm.keys())
    precisions = [pcm[c].get("precision", np.nan) for c in labels]
    recalls = [pcm[c].get("recall", np.nan) for c in labels]
    f1s = [pcm[c].get("f1", np.nan) for c in labels]
    x = np.arange(len(labels))
    width = 0.25
    fig = plt.figure(figsize=(max(6, len(labels)*0.7),4))
    ax = fig.add_subplot(111)
    ax.bar(x - width, precisions, width, label="precision")
    ax.bar(x, recalls, width, label="recall")
    ax.bar(x + width, f1s, width, label="f1")
    ax.set_xticks(x)
    ax.set_xticklabels(labels, rotation=45, ha="right")
    ax.set_title(f"{m['id']} - Per-class P/R/F1")
    ax.set_ylim(0,1.05)
    ax.legend()
    save_fig(fig, os.path.join(model_out, f"{mid}_per_class_prf.png"))
    
    # 4) Confusion matrix heatmap (improved styling)
    cm = md.get("confusion_matrix", {})
    cm_norm = cm.get("normalized", None)
    cm_raw = cm.get("raw", None)
    cm_labels = cm.get("labels", labels)

    if cm_norm is not None or cm_raw is not None:
        arr = np.array(cm_norm if cm_norm is not None else cm_raw)

        fig = plt.figure(figsize=(max(5, arr.shape[1]*0.9), max(4, arr.shape[0]*0.9)))
        ax = fig.add_subplot(111)

        # ----- CHOOSE YOUR COLORMAP HERE -----
        cmap_choice = "Blues"  
        # Other excellent options:
        # "viridis"
        # "plasma"
        # "cividis"
        # "magma"
        # "Greens"
        # "coolwarm"
        # "inferno"

        im = ax.imshow(arr, cmap=cmap_choice)

        fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)

        ax.set_xticks(np.arange(len(cm_labels)))
        ax.set_yticks(np.arange(len(cm_labels)))
        ax.set_xticklabels(cm_labels, rotation=45, ha="right")
        ax.set_yticklabels(cm_labels)

        title_type = "Normalized" if cm_norm is not None else "Raw"
        ax.set_title(f"{m['id']} - Confusion Matrix")

        # Dynamic text color for readability
        threshold = arr.max() / 2.
        for i in range(arr.shape[0]):
            for j in range(arr.shape[1]):
                val = arr[i, j]
                color = "white" if val > threshold else "black"
                text = f"{val:.2f}" if cm_norm is not None else f"{int(val)}"
                ax.text(j, i, text, ha="center", va="center", color=color, fontsize=8)

        save_fig(fig, os.path.join(model_out, f"{mid}_confusion_matrix.png"))
        
    # 5) PR curves - combined plot with one line per class
    pr = md.get("pr_curves", {})
    if pr:
        fig = plt.figure(figsize=(6,5))
        ax = fig.add_subplot(111)
        for cls, data in pr.items():
            precision = data.get("precision", [])
            recall = data.get("recall", [])
            auc = data.get("auc", None)
            # plot precision vs recall
            ax.plot(recall, precision, label=f"{cls} (AUC={auc:.3f})" if auc else cls)
        ax.set_xlabel("Recall")
        ax.set_ylabel("Precision")
        ax.set_title(f"{m['id']} - Precision-Recall curves (one line per class)")
        ax.set_xlim(0,1.0)
        ax.set_ylim(0,1.05)
        ax.legend(loc="lower left", fontsize="small")
        save_fig(fig, os.path.join(model_out, f"{mid}_pr_curves.png"))

# --- Comparative charts ---
# 1) Global metrics comparison (accuracy, macro_f1, weighted_f1) for all models
# --- Comparative Global Metrics (Max 3 models per image) ---

grows = []
for m in models:
    gm = m["metrics"].get("global_metrics", {})
    grows.append({
        "model_id": m["id"],
        "accuracy": gm.get("accuracy", np.nan),
        "macro_f1": gm.get("macro_f1", np.nan),
        "weighted_f1": gm.get("weighted_f1", np.nan),
    })

gdf = pd.DataFrame(grows)

max_models_per_chart = 3
num_models = len(gdf)
num_chunks = math.ceil(num_models / max_models_per_chart)

for chunk_idx in range(num_chunks):
    start = chunk_idx * max_models_per_chart
    end = start + max_models_per_chart
    chunk = gdf.iloc[start:end].set_index("model_id")

    fig = plt.figure(figsize=(8,5))
    ax = fig.add_subplot(111)

    indices = np.arange(len(chunk))
    width = 0.25

    ax.bar(indices - width, chunk["accuracy"], width, label="accuracy")
    ax.bar(indices, chunk["macro_f1"], width, label="macro_f1")
    ax.bar(indices + width, chunk["weighted_f1"], width, label="weighted_f1")

    ax.set_xticks(indices)
    ax.set_xticklabels(chunk.index, rotation=30, ha="right")
    ax.set_ylim(0,1.05)
    ax.set_title("Comparative Global Metrics")
    ax.legend()

    for i, mid in enumerate(chunk.index):
        acc = float(chunk.loc[mid, "accuracy"])
        mf1 = float(chunk.loc[mid, "macro_f1"])
        wf1 = float(chunk.loc[mid, "weighted_f1"])

        ax.text(i - width, acc + 0.02, f"{acc:.3f}", ha="center", va="bottom", fontsize=8)
        ax.text(i, mf1 + 0.02, f"{mf1:.3f}", ha="center", va="bottom", fontsize=8)
        ax.text(i + width, wf1 + 0.02, f"{wf1:.3f}", ha="center", va="bottom", fontsize=8)

    save_fig(fig, os.path.join(OUTPUT_DIR, f"comparative_global_metrics_part_{chunk_idx+1}.png"))
# 2) Comparative per-class F1: for each class across models, create bar charts arranged 3 per row
# Determine union of all class labels across models
all_classes = []
for m in models:
    labels = m["metrics"].get("model_info", {}).get("class_labels", [])
    for lbl in labels:
        if lbl not in all_classes:
            all_classes.append(lbl)

# Build DataFrame: rows=class, cols=model f1
comp_rows = []
for cls in all_classes:
    row = {"class": cls}
    for m in models:
        pcm = m["metrics"].get("per_class_metrics", {})
        row[m["id"]] = pcm.get(cls, {}).get("f1", np.nan)
    comp_rows.append(row)
comp_df = pd.DataFrame(comp_rows).set_index("class")
comp_df.to_csv(os.path.join(OUTPUT_DIR, "comparative_per_class_f1.csv"))

# Create grouped subplot figures, 3 columns per row, each subplot is a bar chart comparing models for that class
ncols = 3
nplots = len(comp_df)
nrows = math.ceil(nplots / ncols)
fig = plt.figure(figsize=(ncols*4, nrows*3 + 1))
for i, cls in enumerate(comp_df.index):
    ax = fig.add_subplot(nrows, ncols, i+1)
    vals = comp_df.loc[cls].values.astype(float)
    ax.bar(np.arange(len(vals)), vals)
    ax.set_xticks(np.arange(len(vals)))
    ax.set_xticklabels(comp_df.columns, rotation=45, ha="right", fontsize=8)
    ax.set_ylim(0,1.05)
    ax.set_title(cls)
    for j,v in enumerate(vals):
        if not np.isnan(v):
            ax.text(j, v + 0.02, f"{v:.3f}", ha="center", va="bottom", fontsize=7)
fig.suptitle("Comparative per-class F1 (up to 3 plots per row)")
save_fig(fig, os.path.join(OUTPUT_DIR, "comparative_per_class_f1_grid.png"))

# 3) Comparative PR curves per class across models (each class gets a subplot; up to 3 per row)
# Build a structure: pr_curves[model_id][class] = dict(precision, recall, auc)
pr_struct = {}
for m in models:
    pr_struct[m["id"]] = m["metrics"].get("pr_curves", {})

ncols = 3
nplots = len(all_classes)
nrows = math.ceil(nplots / ncols)
fig = plt.figure(figsize=(ncols*5, nrows*4 + 1))
for i, cls in enumerate(all_classes):
    ax = fig.add_subplot(nrows, ncols, i+1)
    for mid in pr_struct:
        cls_data = pr_struct[mid].get(cls)
        if cls_data:
            recall = cls_data.get("recall", [])
            precision = cls_data.get("precision", [])
            auc = cls_data.get("auc", None)
            ax.plot(recall, precision, label=f"{mid}" + (f" (AUC={auc:.3f})" if auc else ""))
    ax.set_xlim(0,1.0)
    ax.set_ylim(0,1.05)
    ax.set_title(cls)
    ax.set_xlabel("Recall")
    ax.set_ylabel("Precision")
    ax.legend(fontsize=7)
fig.suptitle("Comparative PR curves per class (up to 3 plots per row)")
save_fig(fig, os.path.join(OUTPUT_DIR, "comparative_pr_curves_per_class_grid.png"))

# Zip the output folder
zip_base = "metrics_plots"
zip_path = shutil.make_archive(zip_base, 'zip', OUTPUT_DIR)

# Also write a small README to the folder
readme = """
Metrics visualization output
Files created per model in subfolders: <model_slug>/*
- *_global_metrics.png: bar chart (accuracy, macro_f1, weighted_f1)
- *_log_loss.png: log loss bar chart
- *_per_class_prf.png: grouped bar chart per class (precision/recall/f1)
- *_confusion_matrix.png: confusion matrix heatmap (normalized if present)
- *_pr_curves.png: precision-recall curves (combined)

Comparative files at top level:
- comparative_global_metrics.png
- comparative_per_class_f1_grid.png (grid with up to 3 plots per row)
- comparative_pr_curves_per_class_grid.png (PR curves per class grid)
- metrics_plots.zip (this archive)
- comparative_global_metrics.csv, comparative_per_class_f1.csv
"""

with open(os.path.join(OUTPUT_DIR, "README.txt"), "w") as fh:
    fh.write(readme)

print(f"Created plots for {len(models)} model(s).")
print(f"Archive ready at: {zip_path}")

# Display comparative global metrics dataframe to user for quick view
try:
    from caas_jupyter_tools import display_dataframe_to_user
    display_dataframe_to_user("comparative_global_metrics", gdf.reset_index())
except Exception:
    # If the helper isn't available, just print head
    print(gdf.head())