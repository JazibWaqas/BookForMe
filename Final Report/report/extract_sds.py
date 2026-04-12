import fitz
import os

sample_dir = r"c:\Users\LENOVO\Desktop\Fyp\JHAT\Final Report\report\sample reports"
output_file = r"c:\Users\LENOVO\Desktop\Fyp\JHAT\Final Report\report\sds_extracted.txt"

with open(output_file, 'w', encoding='utf-8') as out:
    for pdf_name in sorted(os.listdir(sample_dir)):
        if not pdf_name.endswith('.pdf'):
            continue
        path = os.path.join(sample_dir, pdf_name)
        doc = fitz.open(path)
        out.write(f"\n{'='*80}\n")
        out.write(f"REPORT: {pdf_name} ({len(doc)} pages)\n")
        out.write(f"{'='*80}\n")
        
        # Get table of contents
        toc = doc.get_toc()
        if toc:
            out.write("\nTABLE OF CONTENTS:\n")
            for level, title, page in toc:
                out.write(f"  {'  '*(level-1)}{title} (p.{page})\n")
        
        # Find SDS pages
        sds_pages = []
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text()
            text_lower = text.lower()
            if any(kw in text_lower for kw in ['software design', 'system design', 'sds', 'data model', 'data design', 'architecture', 'class diagram', 'sequence diagram', 'entity relationship', 'erd', 'component diagram']):
                sds_pages.append((page_num, text))
        
        if sds_pages:
            out.write(f"\nSDS-related content on {len(sds_pages)} pages\n")
            for page_num, text in sds_pages[:10]:
                out.write(f"\n--- Page {page_num + 1} ---\n")
                out.write(text[:3000] + "\n")
        doc.close()
    
print(f"Output written to {output_file}")
