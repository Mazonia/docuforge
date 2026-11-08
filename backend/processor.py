"""
DocuForge Core Document Processor
Handles placeholder extraction, run-preserving DOCX replacements,
document preview generation, PDF-to-DOCX and DOCX-to-PDF conversion,
and realistic high-resolution PDF page rendering.
"""

import os
import re
import copy
import shutil
import base64
import zipfile
from typing import Dict, List, Any, Optional
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.text.paragraph import Paragraph
import pymupdf

# Windows COM for Word native PDF export
try:
    import pythoncom
    import win32com.client
    HAS_WIN32COM = True
except ImportError:
    HAS_WIN32COM = False


def get_safe_header_footer_paragraphs(doc) -> List[Any]:
    """
    Safely retrieves paragraphs from headers and footers ONLY if header/footer parts
    already exist in the document package relationships.

    Prevents python-docx from implicitly generating empty header/footer XML parts,
    which causes Microsoft Word to add top/bottom header margins and shift
    anchored letterheads and document content down into extra pages.
    """
    paragraphs = []
    try:
        for rel in doc.part.rels.values():
            if "header" in rel.reltype or "footer" in rel.reltype:
                target = rel.target_part
                for p_elem in target.element.xpath(".//w:p"):
                    paragraphs.append(Paragraph(p_elem, target))
    except Exception:
        pass
    return paragraphs


def extract_bracket_placeholders(text: str) -> List[Dict[str, Any]]:
    """
    Extracts all bracketed placeholders from text, including nested or clause placeholders.
    Detects conditional options separated by '/' for dropdown selection.
    """
    results = []
    seen_raw = set()

    # 1. First, check for outer clauses with options or nested brackets:
    # e.g. [is free / carries a setup fee of GHS [amount]]
    # or [deducts a service fee of [X]% from each paid booking]
    # or [by mobile money or bank transfer, within [payout timing] of the service date]
    clause_pattern = re.compile(r'\[([^[\]]*\[[^[\]]+\][^[\]]*)\]')
    for cm in clause_pattern.finditer(text):
        raw = cm.group(0)
        inner = cm.group(1).strip()
        if raw in seen_raw:
            continue
        seen_raw.add(raw)

        # Detect conditional options separated by '/'
        options = []
        is_conditional = False
        if "/" in inner:
            is_conditional = True
            raw_options = [opt.strip() for opt in inner.split("/")]
            # Clean options
            options = [opt for opt in raw_options if opt]

        # Generate a clean short label
        short_label = generate_clean_label(inner)

        results.append({
            "raw": raw,
            "key": inner,
            "label": short_label,
            "type": "clause",
            "is_clause": True,
            "is_conditional": is_conditional,
            "options": options,
            "suggested": options[0] if options else inner
        })

    # 2. Next, find simple non-nested brackets: [Title and Last Name], [Business Name], [X], [amount]
    simple_matches = re.finditer(r'\[([^\[\]\n\r]+)\]', text)
    for m in simple_matches:
        raw = m.group(0)
        inner = m.group(1).strip()
        if not inner or raw in seen_raw:
            continue
        seen_raw.add(raw)

        inferred = infer_placeholder_type(inner)
        results.append({
            "raw": raw,
            "key": inner,
            "label": inner,
            "type": inferred["type"],
            "is_clause": False,
            "is_conditional": False,
            "options": [],
            "suggested": inferred["suggested"]
        })

    return results


def generate_clean_label(clause_text: str) -> str:
    """Generates a concise, human-friendly label for long clauses."""
    lower = clause_text.lower()
    if "is free" in lower or "setup fee" in lower:
        return "Setup Fee Terms"
    if "service fee" in lower or "deducts" in lower:
        return "Commission Fee Rate"
    if "payout" in lower or "transfer" in lower or "mobile money" in lower:
        return "Payout Timing & Terms"
    if len(clause_text) > 30:
        return clause_text[:28] + "..."
    return clause_text


def infer_placeholder_type(key: str) -> Dict[str, str]:
    """Infers an input type and realistic dummy value for a placeholder key."""
    k_lower = key.lower()

    if any(w in k_lower for w in ["name", "client", "customer", "vendor", "recipient"]):
        if any(w in k_lower for w in ["business", "company", "firm", "shop"]):
            return {"type": "text", "suggested": "Studio 45 Visuals"}
        return {"type": "text", "suggested": "Mr. Kwame Darko"}

    if any(w in k_lower for w in ["fee", "price", "amount", "cost", "ghs", "usd", "$"]):
        return {"type": "number", "suggested": "150.00"}

    if any(w in k_lower for w in ["rate", "percentage", "%", "commission"]) or key.strip() == "X":
        return {"type": "number", "suggested": "7"}

    if any(w in k_lower for w in ["date", "time", "deadline", "timing", "schedule"]):
        if "timing" in k_lower:
            return {"type": "text", "suggested": "24 hours"}
        return {"type": "date", "suggested": "2026-12-01"}

    if any(w in k_lower for w in ["service", "category", "industry"]):
        return {"type": "text", "suggested": "photography & live streaming"}

    if any(w in k_lower for w in ["email", "mail"]):
        return {"type": "email", "suggested": "contact@studio45.com"}

    if any(w in k_lower for w in ["phone", "mobile", "tel", "contact"]):
        return {"type": "tel", "suggested": "+233 55 123 4567"}

    if any(w in k_lower for w in ["address", "location", "city"]):
        return {"type": "text", "suggested": "East Legon, Accra"}

    return {"type": "text", "suggested": ""}


def scan_docx_template(docx_path: str) -> Dict[str, Any]:
    """
    Scans a DOCX file to extract metadata, text snippets, and all placeholders.
    """
    if not os.path.exists(docx_path):
        raise FileNotFoundError(f"Template not found: {docx_path}")

    doc = docx.Document(docx_path)
    all_text_chunks = []
    paragraphs_info = []

    # Scan body paragraphs
    for p_idx, p in enumerate(doc.paragraphs):
        p_text = p.text
        if p_text:
            all_text_chunks.append(p_text)
            has_brackets = "[" in p_text and "]" in p_text
            paragraphs_info.append({
                "index": p_idx,
                "text": p_text,
                "style": p.style.name if p.style else "Normal",
                "has_brackets": has_brackets
            })

    # Scan tables
    table_count = len(doc.tables)
    for t_idx, table in enumerate(doc.tables):
        for r_idx, row in enumerate(table.rows):
            for c_idx, cell in enumerate(row.cells):
                for p in cell.paragraphs:
                    if p.text:
                        all_text_chunks.append(p.text)

    # Scan headers and footers safely without creating dummy parts
    for hfp in get_safe_header_footer_paragraphs(doc):
        if hfp.text:
            all_text_chunks.append(hfp.text)

    full_text = "\n".join(all_text_chunks)
    placeholders_list = extract_bracket_placeholders(full_text)

    # Calculate occurrence count and context snippets for each placeholder
    for item in placeholders_list:
        raw = item["raw"]
        item["occurrences"] = full_text.count(raw)

        # Collect surrounding context snippet (up to 3 distinct snippets)
        snippets = []
        for p_info in paragraphs_info:
            if raw in p_info["text"]:
                txt = p_info["text"]
                pos = txt.find(raw)
                start = max(0, pos - 40)
                end = min(len(txt), pos + len(raw) + 40)
                snippet = ("..." if start > 0 else "") + txt[start:end] + ("..." if end < len(txt) else "")
                snippets.append(snippet)
                if len(snippets) >= 3:
                    break
        item["snippets"] = snippets

    words = sum(len(txt.split()) for txt in all_text_chunks)
    file_size = os.path.getsize(docx_path)

    return {
        "filename": os.path.basename(docx_path),
        "filepath": docx_path,
        "filesize": file_size,
        "paragraph_count": len(doc.paragraphs),
        "table_count": table_count,
        "word_count": words,
        "placeholders": placeholders_list,
        "paragraphs": paragraphs_info
    }


def find_text_in_docx(docx_path: str, search_query: str) -> Dict[str, Any]:
    """
    Searches for exact text or phrase in a document, returning occurrences and snippets.
    Used when a user adds a new custom placeholder.
    """
    if not os.path.exists(docx_path):
        return {"found": False, "count": 0, "snippets": []}

    doc = docx.Document(docx_path)
    count = 0
    snippets = []

    for p in doc.paragraphs:
        if search_query in p.text:
            p_count = p.text.count(search_query)
            count += p_count
            pos = p.text.find(search_query)
            start = max(0, pos - 40)
            end = min(len(p.text), pos + len(search_query) + 40)
            snippet = ("..." if start > 0 else "") + p.text[start:end] + ("..." if end < len(p.text) else "")
            snippets.append(snippet)

    for t in doc.tables:
        for r in t.rows:
            for c in r.cells:
                for p in c.paragraphs:
                    if search_query in p.text:
                        p_count = p.text.count(search_query)
                        count += p_count

    return {
        "found": count > 0,
        "count": count,
        "snippets": snippets[:3]
    }


def replace_in_paragraph(paragraph, search_text: str, replace_text: str) -> int:
    """
    Replaces all occurrences of search_text in a paragraph while preserving
    font formatting across multi-run splits in Word XML.
    Ensures no accidental newline characters slip into single-line runs
    which would otherwise cause paragraphs to shift down.
    """
    if search_text not in paragraph.text:
        return 0

    # Sanitize replacement string to prevent unintended line breaks
    clean_replace = str(replace_text).replace('\r\n', ' ').replace('\n', ' ').replace('\r', ' ')

    count = 0
    max_loops = 50
    while search_text in paragraph.text and max_loops > 0:
        max_loops -= 1
        runs = paragraph.runs
        if not runs:
            break

        run_starts = []
        cur_pos = 0
        for r in runs:
            run_starts.append(cur_pos)
            cur_pos += len(r.text)

        idx = paragraph.text.find(search_text)
        if idx == -1:
            break
        end_idx = idx + len(search_text)

        start_r_idx = None
        end_r_idx = None
        for i, r in enumerate(runs):
            r_start = run_starts[i]
            r_end = r_start + len(r.text)
            if r_start <= idx < r_end:
                start_r_idx = i
            if r_start < end_idx <= r_end:
                end_r_idx = i
                break

        if start_r_idx is None or end_r_idx is None:
            # Fallback
            for r in runs:
                if search_text in r.text:
                    r.text = r.text.replace(search_text, clean_replace)
            break

        if start_r_idx == end_r_idx:
            r = runs[start_r_idx]
            offset = idx - run_starts[start_r_idx]
            r.text = r.text[:offset] + clean_replace + r.text[offset + len(search_text):]
        else:
            first_run = runs[start_r_idx]
            offset_first = idx - run_starts[start_r_idx]
            first_run.text = first_run.text[:offset_first] + clean_replace

            for middle_i in range(start_r_idx + 1, end_r_idx):
                runs[middle_i].text = ""

            last_run = runs[end_r_idx]
            offset_last = end_idx - run_starts[end_r_idx]
            last_run.text = last_run.text[offset_last:]

        count += 1

    return count



def replace_in_doc(doc, replacements: Dict[str, str]):
    """
    Applies replacements across all paragraphs, tables, headers, and footers.
    Processes compound clauses first to avoid inner placeholder conflicts.
    """
    # Sort pairs by length descending so longer tokens get matched before short substrings
    sorted_pairs = sorted(replacements.items(), key=lambda x: len(x[0]), reverse=True)

    def process_p(p):
        for search_key, val in sorted_pairs:
            if search_key in p.text:
                replace_in_paragraph(p, search_key, str(val))

    for p in doc.paragraphs:
        process_p(p)

    for t in doc.tables:
        for row in t.rows:
            for cell in row.cells:
                for p in cell.paragraphs:
                    process_p(p)

    for hfp in get_safe_header_footer_paragraphs(doc):
        process_p(hfp)


def generate_document(template_path: str, output_path: str, replacements: Dict[str, str]) -> str:
    """
    Generates a single customized DOCX by substituting placeholders.
    """
    if not os.path.exists(template_path):
        raise FileNotFoundError(f"Template not found: {template_path}")

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    doc = docx.Document(template_path)
    replace_in_doc(doc, replacements)
    doc.save(output_path)
    return output_path


def convert_docx_to_pdf(docx_path: str, output_pdf_path: str) -> str:
    """
    Converts DOCX to PDF using native Microsoft Word via COM for 100% genuine layout fidelity.
    """
    docx_path = os.path.abspath(docx_path)
    output_pdf_path = os.path.abspath(output_pdf_path)
    os.makedirs(os.path.dirname(output_pdf_path), exist_ok=True)

    if not HAS_WIN32COM:
        raise RuntimeError("win32com is not available for Word automation.")

    pythoncom.CoInitialize()
    word = None
    doc = None
    try:
        word = win32com.client.Dispatch("Word.Application")
        word.Visible = False
        word.DisplayAlerts = 0  # wdAlertsNone
        doc = word.Documents.Open(docx_path, ConfirmConversions=False, ReadOnly=True, AddToRecentFiles=False)
        doc.SaveAs2(output_pdf_path, FileFormat=17)  # wdFormatPDF = 17
    finally:
        if doc:
            try:
                doc.Close(SaveChanges=0)
            except Exception:
                pass
        if word:
            try:
                word.Quit()
            except Exception:
                pass
        pythoncom.CoUninitialize()

    if not os.path.exists(output_pdf_path):
        raise RuntimeError("PDF generation failed: Output file was not created.")

    return output_pdf_path


def render_pdf_to_images(pdf_path: str, dpi: int = 150) -> List[str]:
    """
    Renders all pages of a PDF into base64 PNG images for authentic realistic in-browser preview.
    """
    if not os.path.exists(pdf_path):
        return []

    doc = pymupdf.open(pdf_path)
    images = []
    for page in doc:
        pix = page.get_pixmap(dpi=dpi)
        img_bytes = pix.tobytes("png")
        b64 = base64.b64encode(img_bytes).decode("ascii")
        images.append(f"data:image/png;base64,{b64}")
    doc.close()
    return images


def convert_pdf_to_docx(pdf_path: str, output_docx_path: str) -> str:
    """
    Converts an uploaded PDF to DOCX using PyMuPDF to extract text blocks,
    retaining paragraphs, headings, and placeholder tags cleanly.
    """
    pdf_path = os.path.abspath(pdf_path)
    output_docx_path = os.path.abspath(output_docx_path)
    os.makedirs(os.path.dirname(output_docx_path), exist_ok=True)

    pdf_doc = pymupdf.open(pdf_path)
    new_doc = docx.Document()

    for page_idx, page in enumerate(pdf_doc):
        blocks = page.get_text("blocks")
        for b in blocks:
            b_text = b[4].strip()
            if not b_text:
                continue
            lines = b_text.split("\n")
            joined = " ".join(lines).strip()
            if joined:
                p = new_doc.add_paragraph(joined)
                p.paragraph_format.space_before = Pt(0)
                p.paragraph_format.space_after = Pt(2)
                p.paragraph_format.line_spacing = 1.15
                if len(joined) < 80 and (joined.isupper() or joined.endswith(":")):
                    p.style = "Heading 2"

        if page_idx < len(pdf_doc) - 1:
            new_doc.add_page_break()

    pdf_doc.close()
    new_doc.save(output_docx_path)
    return output_docx_path


def render_html_preview(docx_path: str, replacements: Optional[Dict[str, str]] = None) -> List[Dict[str, Any]]:
    """
    Produces structured data of paragraphs for the reactive live text preview.
    Handles compound clauses FIRST so conditional text reflects 100% properly.
    """
    if not os.path.exists(docx_path):
        return []

    doc = docx.Document(docx_path)
    reps = replacements or {}
    elements = []

    # Sort replacements by length descending so compound clauses get handled first
    sorted_reps = sorted(reps.items(), key=lambda x: len(x[0]), reverse=True)

    for p in doc.paragraphs:
        txt = p.text
        if not txt.strip():
            continue

        style_name = p.style.name if p.style else "Normal"
        is_heading = "heading" in style_name.lower() or "title" in style_name.lower()

        # Step 1: Replace compound clauses and explicit replacements first
        rendered_text = txt
        for raw_k, val in sorted_reps:
            if raw_k in rendered_text:
                clean_val = str(val).strip() if val is not None else ""
                if clean_val:
                    # Escape HTML in user replacement
                    escaped_val = (
                        clean_val.replace('&', '&amp;')
                        .replace('<', '&lt;')
                        .replace('>', '&gt;')
                    )
                    safe_key = raw_k.replace('[', '').replace(']', '')[:25]
                    rendered_text = rendered_text.replace(
                        raw_k,
                        f'<span class="doc-filled" data-key="{safe_key}">{escaped_val}</span>'
                    )

        # Step 2: Highlight any remaining un-filled bracket tokens
        def format_remaining_token(m):
            token = m.group(0)
            return f'<span class="doc-placeholder">{token}</span>'

        rendered_text = re.sub(r'\[([^\[\]\n\r]+)\]', format_remaining_token, rendered_text)

        elements.append({
            "type": "paragraph",
            "style": style_name,
            "is_heading": is_heading,
            "raw_text": txt,
            "rendered_html": rendered_text
        })

    return elements
