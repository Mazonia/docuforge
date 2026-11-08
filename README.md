# DocuForge Studio ⚡
### Enterprise Document Template & Multi-Client Batch Generation Engine

DocuForge Studio is a professional, high-performance document automation workspace designed specifically for companies that prepare contracts, proposals, agreements, and customized client documents from Word (.docx) and PDF templates.

---

## 🌟 Key Features

1. **Intelligent Bracket Placeholder Scanner (`[...]`)**:
   - Recursively inspects Word `.docx` documents across all paragraphs, tables, headers, and footers.
   - Detects all dynamic placeholder fields: e.g. `[Business Name]`, `[Title and Last Name]`, `[service type]`, `[amount]`, `[X]`, `[payout timing]`.
   - Also identifies conditional / option clauses (e.g., `[is free / carries a setup fee of GHS [amount]]`).
   - Extracts occurrence frequency, snippet contexts, and infers optimal data types.

2. **Run-Safe Multi-Run XML Replacement Engine**:
   - Solves Microsoft Word's infamous XML run-splitting quirk (where Word splits `[Client Name]` into multiple `<w:r>` tags).
   - Character-span mapped substitution preserves exact font family, size, weights (bold/italic), colors, and paragraph styles.

3. **Two Distinct Data Filling Modes**:
   - **Mode A: Single Document Form**:
     - Fast, focused form with auto-labeled fields.
     - Built-in instant presets (e.g. AsedaHost Photography, Sound Rentals, Catering).
     - Live document preview with reactive badge highlights.
   - **Mode B: Multi-Client Tabular Grid (Batch Studio)**:
     - **Spreadsheet-style data grid** where each row correlates to a single client or vendor so info is never mixed up.
     - Add, duplicate, delete rows with full keyboard navigation.
     - Direct **Copy & Paste** support from Microsoft Excel and Google Sheets.
     - **Export CSV Template** pre-populated with all detected placeholder headers.
     - **Import CSV / TSV** parser with auto-header mapping.
     - Generate all documents in one click, packaged into a `.zip` archive.

4. **100% Native Microsoft Word PDF Export**:
   - Integrates directly with Microsoft Word COM automation (`win32com.client`) on Windows.
   - Every exported PDF has 100% genuine Word typography, pagination, margins, and vector graphic crispness.

5. **PDF Reflow to Word**:
   - Upload either `.docx` or `.pdf` files.
   - Uploaded PDFs are reflowed into editable `.docx` templates while preserving text blocks and bracket placeholders.

6. **Editorial UI / UX (Behance & Figma Curated)**:
   - **Zero AI Slop**: Clean editorial typography, subtle 1px slate borders, fluid spring physics micro-interactions.
   - **Full Dark & Light Mode**: Smooth transition between Crisp Canvas light mode and Midnight Slate dark mode.
   - **3 Harmonious Complementary Colors**:
     - Deep Midnight Base (`#0B0F17` dark, `#F8FAFC` light)
     - Royal Indigo (`#4F46E5` / `#6366F1`)
     - Precision Teal / Emerald (`#0D9488` / `#10B981`)
     - Warm Honey / Amber (`#D97706` / `#F59E0B` for bracket tokens)

---

## 🚀 Quick Start

### 1. Launch the Studio
Simply run the included batch file or Python script:
```powershell
# Double-click start.bat, or run:
cd C:\Users\Mazonia\.gemini\antigravity\scratch\docuforge
python run.py
```
This automatically starts the backend server and opens your default browser at:
👉 **`http://127.0.0.1:8000`**

### 2. Workspace Directory
The application is located at:
`C:\Users\Mazonia\.gemini\antigravity\scratch\docuforge`

Recommended Antigravity workspace setting:
Set `C:\Users\Mazonia\.gemini\antigravity\scratch\docuforge` as your active workspace.

---

## 📁 Project Structure

```
docuforge/
├── backend/
│   ├── main.py              # FastAPI server (upload, scan, preview, single & batch generation)
│   ├── processor.py         # Word XML run replacement, bracket scanner, Word COM PDF exporter
│   ├── samples/             # Bundled templates (e.g. "Aseda Host Business Proposal Letter.docx")
│   ├── uploads/             # Temporary uploaded files
│   ├── output/              # Generated DOCX, PDF, and ZIP archives
│   └── static/              # Compiled high-performance React SPA bundle
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx           # App bar, dark/light toggle, sample loader
│   │   │   ├── FileDropzone.jsx     # Drag & drop upload for DOCX and PDF
│   │   │   ├── SingleForm.jsx       # Single document form with presets & instant download
│   │   │   ├── BatchGrid.jsx        # Multi-client spreadsheet grid with batch generator
│   │   │   ├── DocumentPreview.jsx  # Interactive live A4 preview with real-time token substitution
│   │   │   └── CsvImportModal.jsx   # Excel/Google Sheets copy-paste & CSV importer
│   │   ├── App.jsx                  # Root state & responsive layout
│   │   └── index.css                # Design system variables & tactile animations
│   ├── package.json
│   └── vite.config.js
├── run.py                   # One-click Python launcher
├── start.bat                # One-click Windows batch runner
└── README.md
```

