"""
DocuForge Studio - FastAPI Backend
RESTful API for scanning templates, extracting bracket placeholders,
real-time previewing, and batch Word/PDF document generation.
"""

import os
import io
import csv
import json
import zipfile
import shutil
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

os.makedirs(SAMPLES_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(STATIC_DIR, exist_ok=True)


class GenerateSingleRequest(BaseModel):
    template_path: str
    doc_title: Optional[str] = "Document"
    format: str = "both"  # "docx", "pdf", or "both"
    replacements: Dict[str, Any]


class BatchRecord(BaseModel):
    id: str
    label: Optional[str] = ""
    replacements: Dict[str, Any]


class GenerateBatchRequest(BaseModel):
    template_path: str
    batch_title: Optional[str] = "Batch_Generation"
    format: str = "both"  # "docx", "pdf", or "both"
    records: List[BatchRecord]


class PreviewRequest(BaseModel):
    template_path: str
    replacements: Optional[Dict[str, Any]] = None


@app.get("/api/status")
def get_status():
    """System health check and environmental capabilities."""
    samples = []
    # Check Desktop directly for latest user file
    desktop_file = r"C:\Users\Mazonia\Desktop\Aseda Host Business Proposal Letter.docx"
    if os.path.exists(desktop_file):
        samples.append({
            "name": os.path.basename(desktop_file),
            "path": desktop_file,
            "size": os.path.getsize(desktop_file)
        })

    if os.path.exists(SAMPLES_DIR):
        for f in os.listdir(SAMPLES_DIR):
            if f.endswith((".docx", ".pdf")) and not any(s["name"] == f for s in samples):
                samples.append({
                    "name": f,
                    "path": os.path.join(SAMPLES_DIR, f),
                    "size": os.path.getsize(os.path.join(SAMPLES_DIR, f))
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
    desktop_file = r"C:\Users\Mazonia\Desktop\Aseda Host Business Proposal Letter.docx"
    if os.path.exists(desktop_file):
        samples.append({
            "filename": os.path.basename(desktop_file),
            "filepath": desktop_file,
            "size": os.path.getsize(desktop_file)
        })

    if os.path.exists(SAMPLES_DIR):
        for f in os.listdir(SAMPLES_DIR):
            if f.endswith((".docx", ".pdf")) and not any(s["filename"] == f for s in samples):
                samples.append({
                    "filename": f,
                    "filepath": os.path.join(SAMPLES_DIR, f),
                    "size": os.path.getsize(os.path.join(SAMPLES_DIR, f))
                })
    return {"samples": samples}



@app.post("/api/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Receives an uploaded DOCX or PDF file.
    If PDF, converts it to DOCX first, then extracts all placeholders.
    """
    filename = file.filename
    clean_name = os.path.basename(filename)
    dest_path = os.path.join(UPLOADS_DIR, clean_name)

    content = await file.read()
    with open(dest_path, "wb") as f:
        f.write(content)

    # If PDF, convert to DOCX
    final_docx_path = dest_path
    converted_from_pdf = False
    if clean_name.lower().endswith(".pdf"):
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
    """Scans a template from a local file path."""
    path = path_data.get("path")
    if not path or not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File path not found.")

    if path.lower().endswith(".pdf"):
        docx_path = os.path.splitext(path)[0] + "_converted.docx"
        convert_pdf_to_docx(path, docx_path)
        scan_data = scan_docx_template(docx_path)
        scan_data["converted_from_pdf"] = True
        return scan_data

    scan_data = scan_docx_template(path)
    return scan_data


@app.post("/api/preview")
def preview_document(req: PreviewRequest):
    """Renders structured document preview with highlighted/replaced placeholders."""
    if not os.path.exists(req.template_path):
        raise HTTPException(status_code=404, detail="Template path does not exist.")

    elements = render_html_preview(req.template_path, req.replacements or {})
    return {"elements": elements}


@app.post("/api/preview/render-doc")
def render_doc_preview(req: PreviewRequest):
    """
    Renders actual authentic Word-generated PDF pages as high-resolution images
    for realistic document print & distribution preview before download.
    """
    if not os.path.exists(req.template_path):
        raise HTTPException(status_code=404, detail="Template path does not exist.")

    cache_dir = os.path.join(OUTPUT_DIR, "_preview_cache")
    os.makedirs(cache_dir, exist_ok=True)
    preview_docx = os.path.join(cache_dir, "preview.docx")
    preview_pdf = os.path.join(cache_dir, "preview.pdf")

    try:
        generate_document(req.template_path, preview_docx, req.replacements or {})
        convert_docx_to_pdf(preview_docx, preview_pdf)
        pages = render_pdf_to_images(preview_pdf, dpi=130)
        return {
            "success": True,
            "pages": pages,
            "page_count": len(pages),
            "pdf_url": "/api/download/_preview_cache/preview.pdf"
        }
    except Exception as e:
        return {"success": False, "error": str(e), "pages": []}


@app.post("/api/check-text")
def check_text(data: Dict[str, str]):
    """
    Validates if an exact word or sentence exists in the template document,
    enabling users to add custom placeholders without needing brackets.
    """
    path = data.get("path")
    query = data.get("query", "").strip()
    if not path or not os.path.exists(path) or not query:
        raise HTTPException(status_code=400, detail="Path and search query are required.")

    result = find_text_in_docx(path, query)
    return result



def clean_filename(name: str) -> str:
    """Sanitizes string for valid filesystem file names."""
    keepchars = (' ', '.', '_', '-')
    return "".join(c for c in name if c.isalnum() or c in keepchars).strip()


@app.post("/api/generate/single")
def generate_single(req: GenerateSingleRequest):
    """
    Generates a single customized document in DOCX and/or PDF.
    """
    if not os.path.exists(req.template_path):
        raise HTTPException(status_code=404, detail="Template does not exist.")

    safe_title = clean_filename(req.doc_title or "Custom_Document")
    base_out_name = f"{safe_title}"

    docx_out_path = os.path.join(OUTPUT_DIR, f"{base_out_name}.docx")
    generate_document(req.template_path, docx_out_path, req.replacements)

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
        except Exception as e:
            result["pdf_error"] = str(e)

    return result


@app.post("/api/generate/batch")
def generate_batch(req: GenerateBatchRequest):
    """
    Batch generates documents for multiple clients/records.
    Generates individual DOCX and/or PDF for each record, then creates a ZIP.
    """
    if not os.path.exists(req.template_path):
        raise HTTPException(status_code=404, detail="Template does not exist.")

    batch_slug = clean_filename(req.batch_title or "DocuForge_Batch")
    batch_dir = os.path.join(OUTPUT_DIR, batch_slug)
    os.makedirs(batch_dir, exist_ok=True)

    generated_files = []
    generated_records = []

    for idx, rec in enumerate(req.records):
        # Determine filename identifier
        client_label = rec.label.strip() if rec.label else ""
        if not client_label:
            # Check if replacements has Business Name or Name
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
        generate_document(req.template_path, docx_file, rec.replacements)
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
            "pdf": os.path.basename(pdf_file) if pdf_file else None
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
    """Opens the generated files folder in Windows Explorer."""
    target_dir = OUTPUT_DIR
    if data and data.get("path") and os.path.exists(data.get("path")):
        target_dir = data.get("path")

    try:
        os.startfile(target_dir)
        return {"success": True, "message": f"Opened {target_dir}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to open folder: {str(e)}")


@app.get("/api/download/{filename}")
def download_file(filename: str):
    """Downloads a generated file from OUTPUT_DIR."""
    clean_name = os.path.basename(urllib.parse.unquote(filename))
    filepath = os.path.join(OUTPUT_DIR, clean_name)

    # Check root output or subdirectories
    if not os.path.exists(filepath):
        # Search subdirectories
        for root, dirs, files in os.walk(OUTPUT_DIR):
            if clean_name in files:
                filepath = os.path.join(root, clean_name)
                break

    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found.")

    media_type = "application/octet-stream"
    if clean_name.endswith(".pdf"):
        media_type = "application/pdf"
    elif clean_name.endswith(".docx"):
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif clean_name.endswith(".zip"):
        media_type = "application/zip"

    return FileResponse(
        filepath,
        media_type=media_type,
        filename=clean_name
    )


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

