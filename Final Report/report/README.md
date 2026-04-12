# BookForMe — Kaavish LaTeX report

## Layout (single project root)

Work only inside this folder. Put new figures in **`images/`** (and subfolders like `images/introduction/` if you want), not elsewhere under `Final Report/`.

```
report/
├── report.tex           ← compile this only; title + approval + structure live here
├── references.bib
├── images/logo.pdf      ← HU logo (title page)
├── images/              ← all PNG/PDF figures
└── chapters/            ← chapter bodies only (\input from report.tex)
    ├── introduction.tex
    ├── review.tex
    ├── srs.tex
    ├── sds.tex
    ├── results.tex
    ├── conclusion.tex
    └── reflection.tex
```

Appendix sources (`appendix-*.tex`) stay in `chapters/`; they are not wired in `report.tex` until you uncomment those blocks.

## Team workflow

- Prefer **one chapter (or appendix) per branch or PR** so merges stay small.
- Edit **`references.bib`** for new citations; run a full compile so BibLaTeX updates.
- Avoid renaming image files without updating `\includegraphics` / `\IfFileExists` in the `.tex` that references them.

## Compile

**Cursor / VS Code:** install LaTeX Workshop; open the `report` folder; build `report.tex` (recipe with **biber** or **latexmk**).

**CLI (MiKTeX / TeX Live):**

```bash
cd report
pdflatex report.tex
biber report
pdflatex report.tex
pdflatex report.tex
```

**Overleaf:** zip this `report` folder, set the main document to `report.tex`, compiler **pdfLaTeX** + **biber**.

## Links

- Demo: https://jhat-to9p.onrender.com/chat/index.html
- Repo: https://github.com/JazibWaqas/JHAT
