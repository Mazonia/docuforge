"""
DocuForge Studio - FastAPI Backend
RESTful API for scanning templates, extracting bracket placeholders,
real-time previewing, and batch Word/PDF document generation.
"""

import os
import io
import csv
import json
import time
import zipfile
import shutil
import smtplib
from email.message import EmailMessage
import urllib.parse
from typing import Dict, List, Any, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.processor import (
    scan_docx_template,
    generate_document,
    convert_docx_to_pdf,
    convert_pdf_to_docx,
    render_html_preview,
    render_pdf_to_images,
    find_text_in_docx,
    HAS_WIN32COM
)

app = FastAPI(title="DocuForge Studio API", version="1.0.0")

# Enable CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAMPLES_DIR = os.path.join(BASE_DIR, "samples")
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
STATIC_DIR = os.path.join(BASE_DIR, "static")

# Safe workspace roots
ALLOWED_ROOTS = [
    os.path.abspath(BASE_DIR),
    os.path.abspath(OUTPUT_DIR),
    os.path.abspath(UPLOADS_DIR),
    os.path.abspath(SAMPLES_DIR)
]


def is_safe_path(path: str, allowed_dirs: Optional[List[str]] = None) -> bool:
    """Verifies that an absolute or relative path resides strictly inside authorized directories."""
    if not path:
        return False
    try:
        resolved = os.path.abspath(path)
        roots = allowed_dirs or ALLOWED_ROOTS
        for root in roots:
            root_abs = os.path.abspath(root)
            if resolved == root_abs or resolved.startswith(root_abs + os.sep):
                return True
        return False
    except Exception:
        return False


def validate_file_path(path: str, allowed_dirs: Optional[List[str]] = None) -> str:
    """Validates path safety and existence, raising HTTPException if untrusted or non-existent."""
    if not path or not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File path does not exist.")
    if not is_safe_path(path, allowed_dirs):
        raise HTTPException(status_code=403, detail="Access denied: Path is outside permitted workspace roots.")
    return os.path.abspath(path)


class GenerateSingleRequest(BaseModel):
    template_path: str
    doc_title: Optional[str] = "Document"
    format: str = "both"  # "docx", "pdf", or "both"
    replacements: Dict[str, Any]
    signature_data_url: Optional[str] = None
    hidden_clauses: Optional[List[str]] = None


class BatchRecord(BaseModel):
    id: str
    label: Optional[str] = ""
    replacements: Dict[str, Any]
    signature_data_url: Optional[str] = None
    hidden_clauses: Optional[List[str]] = None


class GenerateBatchRequest(BaseModel):
    template_path: str
    batch_title: Optional[str] = "Batch_Generation"
    format: str = "both"  # "docx", "pdf", or "both"
    records: List[BatchRecord]
    global_signature: Optional[str] = None
    hidden_clauses: Optional[List[str]] = None


class PreviewRequest(BaseModel):
    template_path: str
    replacements: Optional[Dict[str, Any]] = None
    signature_data_url: Optional[str] = None
    hidden_clauses: Optional[List[str]] = None


class EmailDispatchRequest(BaseModel):
    smtp_host: str
    smtp_port: int = 587
    smtp_user: str
    smtp_pass: str
    from_email: str
    to_email: str
    subject: str
    body: str
    attachment_path: str


@app.get("/api/status")
def get_status():
    """System health check and environmental capabilities."""
    samples = []

    # Bundled repo samples (works out of the box for any new user)
    if os.path.exists(SAMPLES_DIR):
        for f in os.listdir(SAMPLES_DIR):
            if f.endswith((".docx", ".pdf")):
                fpath = os.path.join(SAMPLES_DIR, f)
                samples.append({
                    "name": f,
                    "path": fpath,
                    "filepath": fpath,
                    "size": os.path.getsize(fpath)
                })

    return {
        "status": "ready",
        "word_com_available": HAS_WIN32COM,
        "samples_count": len(samples),
        "samples": samples,
        "output_dir": OUTPUT_DIR
    }


@app.get("/api/samples")
def list_samples():
    """Returns available sample templates."""
    samples = []
    if os.path.exists(SAMPLES_DIR):
        for f in os.listdir(SAMPLES_DIR):
            if f.endswith((".docx", ".pdf")):
                fpath = os.path.join(SAMPLES_DIR, f)
                samples.append({
                    "filename": f,
                    "filepath": fpath,
                    "size": os.path.getsize(fpath)
                })

    return {"samples": samples}



@app.post("/api/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Receives an uploaded DOCX or PDF file.
    Validates file extension and size (max 50MB) for robust security.
    If PDF, converts it to DOCX first, then extracts all placeholders.
    """
    filename = file.filename or ""
    clean_name = os.path.basename(filename)
    if not clean_name:
        raise HTTPException(status_code=400, detail="Invalid filename provided.")

    ext = os.path.splitext(clean_name)[1].lower()
    if ext not in [".docx", ".pdf"]:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload a .docx or .pdf template.")

    # Read with size limit (max 50 MB)
    MAX_SIZE = 50 * 1024 * 1024
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum template size is 50MB.")

    dest_path = os.path.join(UPLOADS_DIR, clean_name)
    with open(dest_path, "wb") as f:
        f.write(content)

    # If PDF, convert to DOCX
    final_docx_path = dest_path
    converted_from_pdf = False
    if ext == ".pdf":
        docx_name = os.path.splitext(clean_name)[0] + ".docx"
        final_docx_path = os.path.join(UPLOADS_DIR, docx_name)
        convert_pdf_to_docx(dest_path, final_docx_path)
        converted_from_pdf = True

    try:
        scan_data = scan_docx_template(final_docx_path)
        scan_data["converted_from_pdf"] = converted_from_pdf
        return scan_data
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to scan template: {str(e)}")


@app.post("/api/scan")
def scan_existing_path(path_data: Dict[str, str]):
    """Scans a template from a local file path with safety validation."""
    path = path_data.get("path", "")
    safe_path = validate_file_path(path)

    if safe_path.lower().endswith(".pdf"):
        docx_path = os.path.splitext(safe_path)[0] + "_converted.docx"
        convert_pdf_to_docx(safe_path, docx_path)
        scan_data = scan_docx_template(docx_path)
        scan_data["converted_from_pdf"] = True
        return scan_data

    scan_data = scan_docx_template(safe_path)
    return scan_data


@app.post("/api/preview")
def preview_document(req: PreviewRequest):
    """Renders structured document preview with highlighted/replaced placeholders."""
    safe_template = validate_file_path(req.template_path)

    elements = render_html_preview(
        safe_template,
        req.replacements or {},
        hidden_clauses=req.hidden_clauses,
        signature_data_url=req.signature_data_url
    )
    return {"elements": elements}


@app.post("/api/preview/render-doc")
def render_doc_preview(req: PreviewRequest):
    """
    Renders actual authentic Word-generated PDF pages as high-resolution images
    for realistic document print & distribution preview before download.
    """
    safe_template = validate_file_path(req.template_path)

    cache_dir = os.path.join(OUTPUT_DIR, "_preview_cache")
    os.makedirs(cache_dir, exist_ok=True)
    preview_docx = os.path.join(cache_dir, "preview.docx")
    preview_pdf = os.path.join(cache_dir, "preview.pdf")

    try:
        generate_document(
            safe_template,
            preview_docx,
            req.replacements or {},
            signature_data_url=req.signature_data_url,
            hidden_clauses=req.hidden_clauses
        )
        convert_docx_to_pdf(preview_docx, preview_pdf)
        pages = render_pdf_to_images(preview_pdf, dpi=130)
        return {
            "success": True,
            "pages": pages,
            "page_count": len(pages),
            "pdf_url": f"/api/view-pdf/_preview_cache/preview.pdf?t={int(time.time())}"
        }
    except Exception as e:
        return {"success": False, "error": str(e), "pages": []}


@app.post("/api/check-text")
def check_text(data: Dict[str, str]):
    """
    Validates if an exact word or sentence exists in the template document,
    enabling users to add custom placeholders without needing brackets.
    """
    path = data.get("path", "")
    query = data.get("query", "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="Search query is required.")

    safe_path = validate_file_path(path)
    result = find_text_in_docx(safe_path, query)
    return result



def clean_filename(name: str) -> str:
    """Sanitizes string for valid and safe filesystem file names across Windows and Unix."""
    if not name:
        return "Document"
    # Disallow Windows reserved names (CON, PRN, AUX, NUL, COM1-9, LPT1-9)
    reserved = {"con", "prn", "aux", "nul"} | {f"com{i}" for i in range(1, 10)} | {f"lpt{i}" for i in range(1, 10)}
    keepchars = (' ', '.', '_', '-')
    cleaned = "".join(c for c in name if c.isalnum() or c in keepchars).strip(" .")
    if not cleaned or cleaned.lower() in reserved:
        return "DocuForge_Document"
    return cleaned[:100]


@app.post("/api/generate/single")
def generate_single(req: GenerateSingleRequest):
    """
    Generates a single customized document in DOCX and/or PDF.
    """
    safe_template = validate_file_path(req.template_path)

    safe_title = clean_filename(req.doc_title or "Custom_Document")
    base_out_name = f"{safe_title}"

    docx_out_path = os.path.join(OUTPUT_DIR, f"{base_out_name}.docx")
    generate_document(
        safe_template,
        docx_out_path,
        req.replacements,
        signature_data_url=req.signature_data_url,
        hidden_clauses=req.hidden_clauses
    )

    result = {
        "success": True,
        "title": safe_title,
        "docx_path": docx_out_path,
        "docx_download_url": f"/api/download/{urllib.parse.quote(os.path.basename(docx_out_path))}",
        "pdf_path": None,
        "pdf_download_url": None
    }

    if req.format in ("pdf", "both"):
        pdf_out_path = os.path.join(OUTPUT_DIR, f"{base_out_name}.pdf")
        try:
            convert_docx_to_pdf(docx_out_path, pdf_out_path)
            result["pdf_path"] = pdf_out_path
            result["pdf_download_url"] = f"/api/download/{urllib.parse.quote(os.path.basename(pdf_out_path))}"
            result["pdf_view_url"] = f"/api/view-pdf/{urllib.parse.quote(os.path.basename(pdf_out_path))}"
        except Exception as e:
            result["pdf_error"] = str(e)

    return result


@app.post("/api/generate/batch")
def generate_batch(req: GenerateBatchRequest):
    """
    Batch generates documents for multiple clients/records.
    Generates individual DOCX and/or PDF for each record, then creates a ZIP.
    """
    safe_template = validate_file_path(req.template_path)

    batch_slug = clean_filename(req.batch_title or "DocuForge_Batch")
    batch_dir = os.path.join(OUTPUT_DIR, batch_slug)
    os.makedirs(batch_dir, exist_ok=True)

    generated_files = []
    generated_records = []

    for idx, rec in enumerate(req.records):
        # Determine filename identifier
        client_label = rec.label.strip() if rec.label else ""
        if not client_label:
            for k, v in rec.replacements.items():
                if any(w in k.lower() for w in ["business name", "client name", "name"]):
                    if v and str(v).strip():
                        client_label = str(v).strip()
                        break
        if not client_label:
            client_label = f"Recipient_{idx + 1}"

        file_prefix = f"{idx + 1:02d}_{clean_filename(client_label)}"
        docx_file = os.path.join(batch_dir, f"{file_prefix}.docx")

        # Generate DOCX
        sig = rec.signature_data_url or req.global_signature
        rec_hidden = rec.hidden_clauses or req.hidden_clauses
        generate_document(
            safe_template,
            docx_file,
            rec.replacements,
            signature_data_url=sig,
            hidden_clauses=rec_hidden
        )
        generated_files.append(docx_file)

        pdf_file = None
        if req.format in ("pdf", "both"):
            target_pdf = os.path.join(batch_dir, f"{file_prefix}.pdf")
            try:
                convert_docx_to_pdf(docx_file, target_pdf)
                generated_files.append(target_pdf)
                pdf_file = target_pdf
            except Exception as e:
                print(f"Warning: PDF conversion failed for {client_label}: {e}")

        generated_records.append({
            "id": rec.id,
            "label": client_label,
            "docx": os.path.basename(docx_file),
            "docx_path": docx_file,
            "pdf": os.path.basename(pdf_file) if pdf_file else None,
            "pdf_path": pdf_file,
            "replacements": rec.replacements
        })

    # Create ZIP bundle
    zip_filename = f"{batch_slug}.zip"
    zip_path = os.path.join(OUTPUT_DIR, zip_filename)
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for fpath in generated_files:
            zipf.write(fpath, arcname=os.path.basename(fpath))

    return {
        "success": True,
        "batch_title": batch_slug,
        "total_records": len(req.records),
        "total_files": len(generated_files),
        "zip_path": zip_path,
        "zip_download_url": f"/api/download/{urllib.parse.quote(zip_filename)}",
        "batch_folder": batch_dir,
        "records": generated_records
    }


@app.post("/api/open-output-folder")
def open_output_folder(data: Optional[Dict[str, str]] = None):
    """Opens the generated files folder in Windows Explorer securely."""
    target_dir = OUTPUT_DIR
    if data and data.get("path"):
        requested = data.get("path")
        # Restrict folder opening strictly to OUTPUT_DIR or subfolders
        if is_safe_path(requested, allowed_dirs=[OUTPUT_DIR]) and os.path.exists(requested):
            target_dir = requested

    try:
        os.startfile(target_dir)
        return {"success": True, "message": f"Opened {target_dir}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to open folder: {str(e)}")


@app.get("/api/download/{filename:path}")
def download_file(filename: str):
    """Downloads a generated file safely from OUTPUT_DIR."""
    decoded = urllib.parse.unquote(filename).split("?")[0]
    norm_path = os.path.normpath(decoded).lstrip("\\/")
    candidate = os.path.abspath(os.path.join(OUTPUT_DIR, norm_path))

    if not is_safe_path(candidate, allowed_dirs=[OUTPUT_DIR]) or not os.path.isfile(candidate):
        # Fallback search by basename inside OUTPUT_DIR
        clean_name = os.path.basename(decoded)
        found = None
        for root, dirs, files in os.walk(OUTPUT_DIR):
            if clean_name in files:
                found = os.path.join(root, clean_name)
                break
        if not found or not os.path.isfile(found):
            raise HTTPException(status_code=404, detail="Requested file not found.")
        candidate = found

    clean_name = os.path.basename(candidate)
    media_type = "application/octet-stream"
    if clean_name.endswith(".pdf"):
        media_type = "application/pdf"
    elif clean_name.endswith(".docx"):
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif clean_name.endswith(".zip"):
        media_type = "application/zip"

    return FileResponse(
        candidate,
        media_type=media_type,
        filename=clean_name
    )


@app.get("/api/view-pdf/{filename:path}")
def view_pdf_inline(filename: str):
    """
    Renders generated PDF with inline Content-Disposition so modern browsers open
    their native high-fidelity PDF viewer directly with path traversal protection.
    """
    decoded = urllib.parse.unquote(filename).split("?")[0]
    norm_path = os.path.normpath(decoded).lstrip("\\/")
    candidate = os.path.abspath(os.path.join(OUTPUT_DIR, norm_path))

    if not is_safe_path(candidate, allowed_dirs=[OUTPUT_DIR]) or not os.path.isfile(candidate):
        clean_name = os.path.basename(decoded)
        found = None
        for root, dirs, files in os.walk(OUTPUT_DIR):
            if clean_name in files:
                found = os.path.join(root, clean_name)
                break
        if not found or not os.path.isfile(found):
            raise HTTPException(status_code=404, detail="PDF document not found.")
        candidate = found

    clean_name = os.path.basename(candidate)
    return FileResponse(
        candidate,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{clean_name}"',
            "Cache-Control": "no-cache",
            "X-Content-Type-Options": "nosniff"
        }
    )


@app.post("/api/send-email")
def send_email_dispatch(req: EmailDispatchRequest):
    """
    Sends an email with an attached PDF document through SMTP.
    Validates attachment path strictly to prevent arbitrary local file exfiltration.
    """
    safe_attachment = validate_file_path(req.attachment_path, allowed_dirs=[OUTPUT_DIR, UPLOADS_DIR])

    try:
        msg = EmailMessage()
        msg["Subject"] = req.subject
        msg["From"] = req.from_email
        msg["To"] = req.to_email
        msg.set_content(req.body)

        # Attach file
        with open(safe_attachment, "rb") as f:
            file_data = f.read()
            file_name = os.path.basename(safe_attachment)

        maintype = "application"
        subtype = "pdf" if file_name.endswith(".pdf") else "octet-stream"
        msg.add_attachment(file_data, maintype=maintype, subtype=subtype, filename=file_name)

        if req.smtp_port == 465:
            with smtplib.SMTP_SSL(req.smtp_host, req.smtp_port) as server:
                server.login(req.smtp_user, req.smtp_pass)
                server.send_message(msg)
        else:
            with smtplib.SMTP(req.smtp_host, req.smtp_port) as server:
                server.ehlo()
                try:
                    server.starttls()
                    server.ehlo()
                except Exception:
                    pass  # Non-TLS SMTP fallback
                if req.smtp_user and req.smtp_pass:
                    server.login(req.smtp_user, req.smtp_pass)
                server.send_message(msg)

        return {"success": True, "message": f"Successfully dispatched to {req.to_email}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SMTP dispatch failed: {str(e)}")


@app.post("/api/export-csv-template")
def export_csv_template(data: Dict[str, Any]):
    """Generates a downloadable CSV template with columns for each placeholder."""
    placeholders = data.get("placeholders", [])
    keys = [p.get("key", p.get("raw", "")) for p in placeholders]

    # Include default Row Label
    headers = ["Recipient / Label"] + keys

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)

    # Write a sample row if suggested values exist
    sample_row = ["Example Client"] + [p.get("suggested", "") for p in placeholders]
    writer.writerow(sample_row)

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=template_placeholders.csv"}
    )


# Mount built static frontend if present
if os.path.exists(STATIC_DIR) and os.path.exists(os.path.join(STATIC_DIR, "index.html")):
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")

