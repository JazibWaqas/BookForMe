# Report integration notes

The original report has not been modified. Use the PNG files in
`corrected_images/report_ready/` when updating the LaTeX report. Those files do
not contain embedded figure titles, because the LaTeX captions provide them.

## Required report changes

### SRS use-case section

In `chapters/srs.tex`, subsection `Use Case Diagrams`, the current sentence
incorrectly refers to `fig:srs-block`, which is the system block diagram. Replace
that reference with a dedicated use-case figure using:

```tex
Figure~\ref{fig:srs-usecases} summarizes the interactions between the platform's
customer, WhatsApp customer, vendor, administrator, and payment-verification actors.

\begin{figure}[H]
  \centering
  \includegraphics[width=0.95\textwidth,height=0.72\textheight,keepaspectratio]
    {corrected_images/report_ready/srs-use-case-diagram.png}
  \caption{Use-case diagram for the BookForMe platform.}
  \label{fig:srs-usecases}
\end{figure}
```

Keep `fig:srs-block` exclusively in the `System Block Diagram` section.

### SDS figure replacements

Replace the image paths while retaining the existing Chapter 4 numbering:

- Figure 4.1: `corrected_images/report_ready/figure-4-1-high-level-system-architecture.png`
- Figure 4.2: `corrected_images/report_ready/figure-4-2-complete-firestore-data-model.png`
  - Portrait print source: `corrected_images/figure-4-2-firestore-data-model-portrait.svg`
- Figure 4.3: `corrected_images/report_ready/figure-4-3-ai-booking-payment-sequence.png`
- Figure 4.4: `corrected_images/report_ready/figure-4-4-whatsapp-booking-activity.png`
- Figure 4.5: `corrected_images/report_ready/figure-4-5-mobile-app-booking-activity.png`
- Figure 4.6: `corrected_images/report_ready/figure-4-6-vendor-dashboard-activity.png`

Recommended captions:

- `High-Level System Architecture`
- `Firestore Data Model and Payment Relationships`
- `AI Booking and Payment Sequence`
- `Activity Diagram: WhatsApp AI Booking Flow`
- `Activity Diagram: Mobile Application Search and Booking Flow`
- `Activity Diagram: Vendor Dashboard and Booking Approval Flow`

### Vendor workflow wording

In `chapters/sds.tex`, change the sentence immediately before Figure 4.6 from
releasing `LOCKED` slots to releasing `PENDING` slots. At the approval stage the
slot has already transitioned from `LOCKED` to `PENDING` after payment proof was
accepted.

Suggested wording:

> This workflow maps vendor slot management and payment review. Approval changes
> a pending booking to confirmed, while rejection marks the payment as rejected,
> releases the pending slot to available, and notifies the customer.

## No broader rewrite required

The Chapter 4 pipeline text already describes the intended production
architecture: OCR validation is followed by mandatory vendor review. The current
auto-confirm behavior in testing code is an implementation shortcut and does not
need to be documented as the intended architecture.
