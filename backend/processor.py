"""
DocuForge Core Document Processor
Handles placeholder extraction, run-preserving DOCX replacements,
document preview generation, PDF-to-DOCX and DOCX-to-PDF conversion,
image/signature embedding, formatters, and realistic PDF rendering.
"""

import os
import re
import copy
import shutil
import base64
import zipfile
import datetime
import tempfile
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


def number_to_words(n: float) -> str:
    """Converts a number to written English words (e.g. 45000 -> Forty-Five Thousand)."""
    try:
        n_int = int(n)
    except Exception:
        return str(n)

    ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
            "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
            "Seventeen", "Eighteen", "Nineteen"]
    tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

    def convert_below_thousand(num):
        res = []
        if num >= 100:
            res.append(ones[num // 100] + " Hundred")
            num %= 100
        if num >= 20:
            t = tens[num // 10]
            if num % 10 != 0:
                t += "-" + ones[num % 10]
            res.append(t)
        elif num > 0:
            res.append(ones[num])
        return " ".join(res)

    if n_int == 0:
        return "Zero"

    parts = []
    billions = n_int // 1000000000
    n_int %= 1000000000
    if billions:
        parts.append(convert_below_thousand(billions) + " Billion")

    millions = n_int // 1000000
    n_int %= 1000000
    if millions:
        parts.append(convert_below_thousand(millions) + " Million")

    thousands = n_int // 1000
    n_int %= 1000
    if thousands:
        parts.append(convert_below_thousand(thousands) + " Thousand")

    if n_int:
        parts.append(convert_below_thousand(n_int))

    return " ".join(parts).strip()


def apply_formatting_filter(raw_value: Any, filter_type: str) -> str:
    """
    Applies built-in formatting filters:
    - currency:USD / currency:GHS / currency:EUR / currency
    - date:long / date:iso / date:relative
    - words (number to written words)
    - uppercase / lowercase / titlecase
    """
    if raw_value is None:
        return ""
    val_str = str(raw_value).strip()
    f = filter_type.strip().lower()

    # Currency formatters
    if f.startswith("currency"):
        parts = f.split(":")
        curr_code = parts[1].upper() if len(parts) > 1 else "USD"
        symbols = {"USD": "$", "GHS": "GH₵ ", "EUR": "€", "GBP": "£", "CREDITS": " CR"}
        clean_num = re.sub(r'[^0-9.-]', '', val_str)
        try:
            num = float(clean_num)
            symbol = symbols.get(curr_code, f"{curr_code} ")
            if curr_code == "CREDITS":
                return f"{num:,.2f}{symbol}"
            return f"{symbol}{num:,.2f}"
        except Exception:
            return val_str

    # Number to written words
    if f == "words":
        clean_num = re.sub(r'[^0-9.-]', '', val_str)
        try:
            num = float(clean_num)
            return number_to_words(num)
        except Exception:
            return val_str

    # Date formatters
    if f.startswith("date"):
        try:
            d = None
            for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%Y/%m/%d"):
                try:
                    d = datetime.datetime.strptime(val_str, fmt)
                    break
                except Exception:
                    pass
            if d:
                if "long" in f:
                    day = d.day
                    suffix = 'th' if 11 <= day <= 13 else {1: 'st', 2: 'nd', 3: 'rd'}.get(day % 10, 'th')
                    return d.strftime(f"%d{suffix} %B, %Y")
                elif "iso" in f:
                    return d.strftime("%Y-%m-%d")
        except Exception:
            pass

    # Text transform formatters
    if f == "uppercase":
        return val_str.upper()
    if f == "lowercase":
        return val_str.lower()
    if f == "titlecase":
        return val_str.title()

    return val_str


def extract_bracket_placeholders(text: str) -> List[Dict[str, Any]]:
    """
    Extracts all bracketed placeholders from text, including nested or clause placeholders.
    Detects conditional options separated by '/' for dropdown selection.
    """
    results = []
    seen_raw = set()

    # 1. First, check for outer clauses with options or nested brackets
    clause_pattern = re.compile(r'\[([^[\]]*\[[^[\]]+\][^[\]]*)\]')
    for cm in clause_pattern.finditer(text):
        raw = cm.group(0)
        inner = cm.group(1).strip()
        if raw in seen_raw:
            continue
        seen_raw.add(raw)

        options = []
        is_conditional = False
        if "/" in inner:
            is_conditional = True
            raw_options = [opt.strip() for opt in inner.split("/")]
            options = [opt for opt in raw_options if opt]

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

    # 2. Next, find simple non-nested brackets: [Placeholder] or [Placeholder:filter]
    simple_matches = re.finditer(r'\[([^\[\]\n\r]+)\]', text)
    for m in simple_matches:
        raw = m.group(0)
        inner = m.group(1).strip()
        if not inner or raw in seen_raw:
            continue
        seen_raw.add(raw)

        # Check for filter syntax: e.g. [amount:currency:GHS]
        base_key = inner
        filter_name = ""
        if ":" in inner and not inner.lower().startswith("http"):
            parts = inner.split(":", 1)
            base_key = parts[0].strip()
            filter_name = parts[1].strip()

        inferred = infer_placeholder_type(base_key)
        results.append({
            "raw": raw,
            "key": base_key,
            "filter": filter_name,
            "label": base_key,
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
    if "is free" in lower or "setup fee" in lower or "subsidized" in lower or "surcharge" in lower:
        return "Fee & Subsidy Terms"
    if "service fee" in lower or "logistics fee" in lower or "deducts" in lower:
        return "Fee Rate Protocol"
    if "payout" in lower or "transfer" in lower or "timing" in lower:
        return "Payout / Transfer Window"
    if len(clause_text) > 30:
        return clause_text[:28] + "..."
    return clause_text


def infer_placeholder_type(key: str) -> Dict[str, str]:
    """Infers an input type and realistic dummy value for a placeholder key."""
    k_lower = key.lower()

    if any(w in k_lower for w in ["name", "client", "commander", "ranger", "vendor", "recipient"]):
        if any(w in k_lower for w in ["unit", "squadron", "business", "company"]):
            return {"type": "text", "suggested": "Aegis Recon Squadron 9"}
        return {"type": "text", "suggested": "Commander Valeria Cross"}

    if any(w in k_lower for w in ["fee", "price", "amount", "cost", "bounty", "credits", "$"]):
        return {"type": "number", "suggested": "45,000"}

    if any(w in k_lower for w in ["rate", "percentage", "%", "commission"]) or key.strip() == "X":
        return {"type": "number", "suggested": "6"}

    if any(w in k_lower for w in ["date", "time", "deadline", "timing", "schedule"]):
        if "timing" in k_lower:
            return {"type": "text", "suggested": "24 hours"}
        return {"type": "date", "suggested": "2026-12-01"}

    if any(w in k_lower for w in ["division", "specialization", "service", "category"]):
        return {"type": "text", "suggested": "Deep Space Plasma Interception"}

    if any(w in k_lower for w in ["sector", "location", "star"]):
        return {"type": "text", "suggested": "Kepler Outpost Sector 4"}

    if any(w in k_lower for w in ["vessel", "class", "ship"]):
        return {"type": "text", "suggested": "Vanguard Hyper-Cruiser MK-IV"}

    if any(w in k_lower for w in ["email", "mail"]):
        return {"type": "email", "suggested": "cross@novavanguard.space"}

    if any(w in k_lower for w in ["signature", "stamp"]):
        return {"type": "signature", "suggested": ""}

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

    for item in placeholders_list:
        raw = item["raw"]
        item["occurrences"] = full_text.count(raw)

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
    Used when a user adds a new custom placeholder by highlighting or typing.
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
                        count += p.text.count(search_query)

    return {
        "found": count > 0,
        "count": count,
        "snippets": snippets[:3]
    }


def replace_in_paragraph(paragraph, search_text: str, replace_text: str, signature_image_path: Optional[str] = None) -> int:
    """
    Replaces all occurrences of search_text in a paragraph while preserving
    font formatting across multi-run splits in Word XML.
    If signature_image_path is provided and search_text is a signature tag,
    embeds the image directly into the run!
    """
    if search_text not in paragraph.text:
        return 0

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
            for r in runs:
                if search_text in r.text:
                    r.text = r.text.replace(search_text, clean_replace)
            break

        if start_r_idx == end_r_idx:
            r = runs[start_r_idx]
            offset = idx - run_starts[start_r_idx]
            r.text = r.text[:offset] + clean_replace + r.text[offset + len(search_text):]
            if signature_image_path and os.path.exists(signature_image_path) and any(w in search_text.lower() for w in ["signature", "stamp"]):
                r.text = ""
                r.add_picture(signature_image_path, width=Inches(1.5))
        else:
            first_run = runs[start_r_idx]
            offset_first = idx - run_starts[start_r_idx]
            first_run.text = first_run.text[:offset_first] + clean_replace

            for middle_i in range(start_r_idx + 1, end_r_idx):
                runs[middle_i].text = ""

            last_run = runs[end_r_idx]
            offset_last = end_idx - run_starts[end_r_idx]
            last_run.text = last_run.text[offset_last:]

            if signature_image_path and os.path.exists(signature_image_path) and any(w in search_text.lower() for w in ["signature", "stamp"]):
                first_run.text = ""
                first_run.add_picture(signature_image_path, width=Inches(1.5))

        count += 1

    return count


def replace_in_doc(doc, replacements: Dict[str, str], signature_path: Optional[str] = None):
    """
    Applies replacements across all paragraphs, tables, headers, and footers.
    Processes compound clauses first to avoid inner placeholder conflicts.
    """
    sorted_pairs = sorted(replacements.items(), key=lambda x: len(x[0]), reverse=True)

    def process_p(p):
        for search_key, val in sorted_pairs:
            if search_key in p.text:
                replace_in_paragraph(p, search_key, str(val), signature_path)

    for p in doc.paragraphs:
        process_p(p)

    for t in doc.tables:
        for row in t.rows:
            for cell in row.cells:
                for p in cell.paragraphs:
                    process_p(p)

    for hfp in get_safe_header_footer_paragraphs(doc):
        process_p(hfp)


def generate_document(
    template_path: str,
    output_path: str,
    replacements: Dict[str, str],
    signature_data_url: Optional[str] = None,
    hidden_clauses: Optional[List[str]] = None
) -> str:
    """
    Generates a single customized DOCX by substituting placeholders,
    applying optional digital signature embedding, and pruning optional clauses.
    """
    if not os.path.exists(template_path):
        raise FileNotFoundError(f"Template not found: {template_path}")

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    doc = docx.Document(template_path)

    # 1. Handle optional paragraph exclusion if specified
    if hidden_clauses:
        for phrase in hidden_clauses:
            for p in list(doc.paragraphs):
                if phrase and phrase in p.text:
                    p._element.getparent().remove(p._element)

    # 2. Extract signature image to temporary file if provided as base64
    temp_sig_path = None
    if signature_data_url and "," in signature_data_url:
        try:
            header, encoded = signature_data_url.split(",", 1)
            sig_bytes = base64.b64decode(encoded)
            fd, temp_sig_path = tempfile.mkstemp(suffix=".png")
            os.close(fd)
            with open(temp_sig_path, "wb") as f:
                f.write(sig_bytes)
        except Exception:
            temp_sig_path = None

    try:
        replace_in_doc(doc, replacements, signature_path=temp_sig_path)
        doc.save(output_path)
    finally:
        if temp_sig_path and os.path.exists(temp_sig_path):
            try:
                os.remove(temp_sig_path)
            except Exception:
                pass

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


def render_html_preview(
    docx_path: str,
    replacements: Optional[Dict[str, str]] = None,
    hidden_clauses: Optional[List[str]] = None,
    signature_data_url: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Produces structured data of paragraphs for the reactive live text preview.
    Handles compound clauses FIRST so conditional text reflects 100% properly.
    Supports interactive highlight-to-placeholder and optional clause exclusions.
    """
    if not os.path.exists(docx_path):
        return []

    doc = docx.Document(docx_path)
    reps = replacements or {}
    elements = []
    excluded = hidden_clauses or []

    sorted_reps = sorted(reps.items(), key=lambda x: len(x[0]), reverse=True)

    for p in doc.paragraphs:
        txt = p.text
        if not txt.strip():
            continue

        # Check if paragraph matches an excluded optional clause
        if any(h and h in txt for h in excluded):
            continue

        style_name = p.style.name if p.style else "Normal"
        is_heading = "heading" in style_name.lower() or "title" in style_name.lower()

        rendered_text = (
            txt.replace('&', '&amp;')
            .replace('<', '&lt;')
            .replace('>', '&gt;')
        )
        for raw_k, val in sorted_reps:
            if raw_k in txt:
                clean_val = str(val).strip() if val is not None else ""
                if signature_data_url and any(w in raw_k.lower() for w in ["signature", "stamp"]):
                    # Ensure signature_data_url is a genuine data image URL
                    if signature_data_url.startswith("data:image/"):
                        sig_html = f'<img src="{signature_data_url}" alt="Digital Signature" class="inline-block h-8 max-w-[140px] border-b border-dashed border-teal-500 align-middle my-1" />'
                        rendered_text = rendered_text.replace(raw_k, sig_html)
                elif clean_val:
                    escaped_val = (
                        clean_val.replace('&', '&amp;')
                        .replace('<', '&lt;')
                        .replace('>', '&gt;')
                    )
                    safe_key = re.sub(r'[^a-zA-Z0-9_-]', '', raw_k)[:25]
                    rendered_text = rendered_text.replace(
                        raw_k,
                        f'<span class="doc-filled" data-key="{safe_key}">{escaped_val}</span>'
                    )

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
