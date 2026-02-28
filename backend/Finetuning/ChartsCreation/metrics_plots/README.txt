
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
