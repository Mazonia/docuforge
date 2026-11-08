# DocuForge Studio ⚡
### Enterprise Word (.docx) & PDF Template Engine with Multi-Client Batch Studio

DocuForge Studio is a professional, high-performance document automation workspace designed for businesses, law firms, and agencies that prepare tailored proposals, agreements, contracts, and quotes from Microsoft Word (`.docx`) and PDF templates.

It replaces fragile legacy Mail Merge tools with **run-safe OpenXML AST substitution**, **margin-locked coordinate preservation**, and **native Microsoft Word COM automation** for pixel-perfect PDF export with zero layout drift.

---

## 🌟 Key Features

1. **Smart Bracket Placeholder Scanner (`[...]`)**:
   - Recursively inspects Word `.docx` documents across all paragraphs, tables, headers, and footers.
   - Detects dynamic fields: e.g. `[Business Name]`, `[Title and Last Name]`, `[service type]`, `[amount]`, `[payout timing]`.
   - Automatically handles conditional option clauses (e.g. `[is free / carries a setup fee of GHS [amount]]`) with dropdowns and freeform editing.

2. **Run-Safe Multi-Run XML Replacement Engine**:
   - Solves Microsoft Word's XML run-splitting behavior where Word fragments words and brackets into multiple `<w:r>` tags.
   - Computes character offsets across split run boundaries, substituting content in-place while strictly preserving original fonts, sizes, weights, and colors.

3. **Zero-Shift Margin & Letterhead Preservation**:
   - Prevents artificial header and footer injection that causes Word to add default 0.5-inch margins.
   - Guarantees anchored letterheads, company logos, and 2-page documents remain strictly in their original coordinate space without pushing lines onto extra pages.

4. **Add Custom Placeholders on the Fly**:
   - Highlight any text in the live preview or type an exact word or sentence to define a custom variable without having to re-edit the source Word document.

5. **Dual Previews (Interactive Markup & Realistic Word/PDF)**:
   - **Live Markup View**: Real-time reactive token substitution with visual tag highlighting.
   - **Realistic Word / PDF View**: High-resolution 150 DPI rasterized pages rendered via Microsoft Word COM.
   - **Inline PDF Reader**: View generated PDFs directly in the browser's native reader with zero download popups or pretty-print dialogs.

6. **Two Distinct Data Filling Modes**:
   - **Mode A: Single Document Form**: Fast, focused form with auto-labeled fields, business presets, and instant download/viewing.
   - **Mode B: Multi-Client Tabular Grid (Batch Studio)**:
     - Responsive spreadsheet-style data grid where rows correlate to individual clients so data is never cross-contaminated.
     - Direct **Copy & Paste** support from Microsoft Excel and Google Sheets.
     - **Export CSV Template** and **Import CSV / TSV** parser.
     - One-click batch generation packaged into an organized `.zip` bundle.

7. **Executive Ergonomics (Zero AI Slop)**:
   - Custom executive palette: Cerulean Blue (`#0284C7`), Emerald Jade (`#059669`), Warm Ochre Amber (`#D97706`).
   - Absolutely zero purple/violet/indigo AI gradients.
   - Full dark and light theme support with fluid spring physics.

---

## 🤖 Search, Answer & Generative Engine Optimization (SEO / AEO / GEO)

DocuForge is built with modern search and generative engine indexing in mind:
- **AEO (Answer Engine Optimization)**: Embedded `application/ld+json` Schema.org `FAQPage` and `SoftwareApplication` graphs providing direct answers for Perplexity, ChatGPT Search, Bing Copilot, and Google AI Overviews.
- **GEO (Generative Engine Optimization)**: Semantic entity definitions and structured data trees for LLM scrapers and agentic assistants.
- **SEO**: Complete OpenGraph, Twitter Card, `robots.txt`, and XML sitemap specifications.

---

## 🚀 Quick Start

### 1. Requirements
- Windows 10/11 with Python 3.10+
- Microsoft Word (for native COM PDF export; fallback mode available)
- Node.js 18+ (for frontend development)

### 2. Launching DocuForge
```powershell
# Clone the repository
git clone https://github.com/Mazonia/docuforge.git
cd docuforge

# Launch backend and UI
python run.py
```
Open your browser at **`http://127.0.0.1:8000`**.

---

## 📁 Repository Structure

```
docuforge/
├── backend/
│   ├── main.py              # FastAPI REST server & inline PDF viewer
│   ├── processor.py         # Run-safe XML engine, bracket scanner, Word COM export
│   ├── samples/             # Bundled templates (Aseda Host Business Proposal)
│   ├── output/              # Generated DOCX, PDF, and ZIP archives
│   └── static/              # Production React SPA build
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx           # App bar, theme toggle, about modal trigger
│   │   │   ├── AboutModal.jsx       # About DocuForge, AEO/GEO FAQ & architecture
│   │   │   ├── FileDropzone.jsx     # Template upload for DOCX and PDF
│   │   │   ├── SingleForm.jsx       # Single document form with instant view & download
│   │   │   ├── BatchGrid.jsx        # Multi-client spreadsheet grid with CSV batching
│   │   │   ├── DocumentPreview.jsx  # Interactive live & realistic Word/PDF preview
│   │   │   └── CsvImportModal.jsx   # CSV/Excel batch data importer
│   │   ├── App.jsx                  # Root state & responsive layout
│   │   └── index.css                # Executive palette & tactile CSS
│   ├── public/
│   │   ├── robots.txt               # SEO crawler directives
│   │   └── sitemap.xml              # Sitemap
│   ├── index.html                   # SEO, AEO & GEO JSON-LD schemas
│   └── vite.config.js
├── run.py                   # Python launcher
├── start.bat                # Windows one-click runner
└── README.md
```

---

## 📄 License
MIT License. Created by [Mazonia](https://github.com/Mazonia).
