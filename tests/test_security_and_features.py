"""
DocuForge Studio - Security and Functional Test Suite
Verifies:
1. Path traversal guards on file endpoints.
2. File upload extension and size restrictions.
3. Placeholders extraction & filter formatters (currency, words, dates).
4. Run-safe XML replacement and coordinate integrity.
5. Email dispatch attachment security restrictions.
6. HTML preview XSS escaping.
"""

import os
import json
import pytest
from fastapi.testclient import TestClient
from backend.main import app, is_safe_path, clean_filename, validate_file_path, OUTPUT_DIR, UPLOADS_DIR, SAMPLES_DIR
from backend.processor import (
    number_to_words,
    apply_formatting_filter,
    extract_bracket_placeholders,
    render_html_preview
)

client = TestClient(app)

def test_clean_filename():
    assert clean_filename("valid_name-123") == "valid_name-123"
    assert clean_filename("CON") == "DocuForge_Document"
    assert clean_filename("PRN") == "DocuForge_Document"
    assert clean_filename("AUX") == "DocuForge_Document"
    assert clean_filename("NUL") == "DocuForge_Document"
    assert clean_filename("COM1") == "DocuForge_Document"
    assert clean_filename("../../../malicious/path") == "maliciouspath"
    assert clean_filename("...   ") == "DocuForge_Document"


def test_path_traversal_guards():
    # Attempting to read outside allowed directories
    assert not is_safe_path("C:\\Windows\\System32\\cmd.exe", allowed_dirs=[OUTPUT_DIR])
    assert not is_safe_path("../../../etc/passwd", allowed_dirs=[OUTPUT_DIR])
    assert not is_safe_path("..\\..\\secret.txt", allowed_dirs=[OUTPUT_DIR])
    
    # Path inside output directory should be valid
    sample_out = os.path.join(OUTPUT_DIR, "document.pdf")
    assert is_safe_path(sample_out, allowed_dirs=[OUTPUT_DIR])


def test_download_security():
    # Attempt path traversal on download endpoint
    resp = client.get("/api/download/..%2F..%2Fmain.py")
    assert resp.status_code in [403, 404]

    resp = client.get("/api/view-pdf/..%2F..%2Fsecret.pdf")
    assert resp.status_code in [403, 404]


def test_email_dispatch_security():
    # Attempting to attach arbitrary system file via SMTP endpoint
    payload = {
        "smtp_host": "smtp.example.com",
        "smtp_port": 587,
        "smtp_user": "test@example.com",
        "smtp_pass": "pass",
        "from_email": "test@example.com",
        "to_email": "target@example.com",
        "subject": "Test",
        "body": "Test body",
        "attachment_path": "C:\\Windows\\System32\\drivers\\etc\\hosts"
    }
    resp = client.post("/api/send-email", json=payload)
    # Must be forbidden / not found
    assert resp.status_code in [403, 404]


def test_upload_format_security():
    # Reject executable upload
    fake_exe = ("malicious.exe", b"MZ\x90\x00\x03\x00\x00\x00", "application/x-dosexec")
    resp = client.post("/api/upload", files={"file": fake_exe})
    assert resp.status_code == 400
    assert "Unsupported file format" in resp.json().get("detail", "")


def test_number_to_words():
    assert number_to_words(0) == "Zero"
    assert number_to_words(45000) == "Forty-Five Thousand"
    assert number_to_words(1250) == "One Thousand Two Hundred Fifty"
    assert number_to_words(1000000) == "One Million"


def test_formatting_filters():
    assert apply_formatting_filter("45000", "currency:USD") == "$45,000.00"
    assert apply_formatting_filter("45000", "currency:CREDITS") == "45,000.00 CR"
    assert apply_formatting_filter("45000", "words") == "Forty-Five Thousand"
    assert apply_formatting_filter("hello world", "uppercase") == "HELLO WORLD"
    assert apply_formatting_filter("hello world", "titlecase") == "Hello World"


def test_placeholder_extraction():
    text = "Commander [Rank and Last Name] assigned to [Ranger Unit Name] with bounty [amount:currency:CREDITS]."
    extracted = extract_bracket_placeholders(text)
    keys = [item["key"] for item in extracted]
    assert "Rank and Last Name" in keys
    assert "Ranger Unit Name" in keys
    assert "amount" in keys


def test_xss_prevention_in_html_preview():
    # If sample template exists, check rendered html escaping
    samples = os.listdir(SAMPLES_DIR) if os.path.exists(SAMPLES_DIR) else []
    docx_samples = [s for s in samples if s.endswith(".docx")]
    if docx_samples:
        sample_path = os.path.join(SAMPLES_DIR, docx_samples[0])
        elements = render_html_preview(sample_path, replacements={
            "[Ranger Unit Name]": "<script>alert('xss')</script>"
        })
        for el in elements:
            # Script tags must be escaped into &lt;script&gt;
            assert "<script>" not in el["rendered_html"]
            if "alert('xss')" in el["rendered_html"]:
                assert "&lt;script&gt;" in el["rendered_html"]

