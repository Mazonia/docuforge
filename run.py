"""
DocuForge Studio - Application Runner
Starts the FastAPI server and opens the application in your browser.
"""

import os
import sys
import time
import webbrowser
import threading
import uvicorn

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

def open_browser():
    time.sleep(1.2)
    url = "http://127.0.0.1:8000"
    print(f"\n[DocuForge] Opening web browser at {url} ...")
    webbrowser.open(url)

if __name__ == "__main__":
    print("=" * 64)
    print("  DocuForge Studio — Document Template & Batch Generation")
    print("  Mode: Production Hybrid (FastAPI + Word COM + React)")
    print("  URL : http://127.0.0.1:8000")
    print("=" * 64)

    # Launch browser in a background thread
    threading.Thread(target=open_browser, daemon=True).start()

    # Run Uvicorn server
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=False)

