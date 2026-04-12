# BookForMe — Kaavish LaTeX Report

## File Structure

```
bookforme_report/
├── report.tex              ← MAIN FILE — compile this
├── titlepage.tex           ← Title page (matches HU Kaavish template)
├── approval.tex            ← Approval / signature page
├── references.bib          ← BibLaTeX bibliography (28 entries)
├── images/                 ← Place logo.pdf and any figures here
│   └── logo.pdf            ← HU logo (obtain from HU IT / website)
└── chapters/
    ├── introduction.tex    ← Chapter 1: Problem, Solution, Users, Gantt, Challenges
    ├── review.tex          ← Chapter 2: Literature Review + Gap Analysis
    ├── srs.tex             ← Chapter 3: SRS (FR, NFR, Block Diagram, Wireframes)
    ├── sds.tex             ← Chapter 4: SDS (Architecture, Data Model, Algorithms)
    ├── results.tex         ← Chapter 5: Methodology, Experiments, Results
    ├── conclusion.tex      ← Chapter 6: Conclusion and Future Work
    ├── reflection.tex      ← Chapter 7: Learning, Team, Project, Process Reflection
    ├── appendix-math.tex   ← Appendix A: Elo, Softmax, Focal Loss, OCC Math
    ├── appendix-data.tex   ← Appendix B: Dataset Schema, Samples, Augmentation Stats
    └── appendix-code.tex   ← Appendix C: LangGraph, OCC, NLU, OCR, Elo, Webhook Code
```

## How to Compile

### Overleaf (recommended)
1. Upload this entire folder as a new Overleaf project.
2. Set the main document to `report.tex`.
3. Add `logo.pdf` to the root folder (HU logo).
4. Click Compile — use **pdfLaTeX** or **LuaLaTeX**.

### Local (TeX Live / MiKTeX)
```bash
cd bookforme_report
pdflatex report.tex
biber report
pdflatex report.tex
pdflatex report.tex   # third pass for TOC/cross-refs
```

## Adding Figures
- Export diagrams as PDF or PNG, place in `images/`.
- Uncomment the `\includegraphics` lines in srs.tex, sds.tex etc. and 
  replace the `\fbox{\parbox{...}}` placeholder blocks.

## Template Compliance
This report follows the exact structure of the Habib University Kaavish 
template (`report.tex`, `titlepage.tex`, `approval.tex`, `references.bib`,
and `chapters/` subdirectory) as provided.

## Live Deployment
- Demo: https://jhat-to9p.onrender.com/chat/index.html
- Repo: https://github.com/JazibWaqas/JHAT
- Test Cases: https://docs.google.com/spreadsheets/d/1heJM6RQdEcIMmFQiDJzSi3AO8KEGFXi-1yA1XRgrORs
