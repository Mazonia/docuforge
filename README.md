# DocuForge Studio ⚡
### High-Performance Word (.docx) & PDF Template Engine with Multi-Client Batch Studio

DocuForge Studio is a high-performance document automation workspace designed for businesses, law firms, and agencies that prepare tailored proposals, agreements, contracts, and quotes from Microsoft Word (`.docx`) and PDF templates.

It replaces fragile legacy Mail Merge tools with **run-safe OpenXML AST substitution**, **margin-locked coordinate preservation**, and **native Microsoft Word COM automation** for pixel-perfect PDF export with zero layout drift.

---

## 🌟 Key Features

1. **Smart Bracket Placeholder Scanner (`[...]`)**:
   - Recursively inspects Word `.docx` documents across all paragraphs, tables, headers, and footers.
   - Detects dynamic fields: e.g. `[Business Name]`, `[Title and Last Name]`, `[service type]`, `[amount]`, `[payout timing]`.
   - Automatically handles conditional option clauses (e.g. `[is fully subsidized by Galactic Council / carries an auxiliary warp-cell surcharge of [amount] Credits]`) with dropdowns and freeform editing.

2. **Visual Point-and-Click Placeholder Tagging**:
   - Highlight any word or sentence in the live document preview to immediately summon a dark turquoise tag pill: `Turn into Placeholder`.
   - Instantly converts the selected phrase into a dynamic variable without having to re-edit the source Word document or manually type brackets.

3. **Auto-Calculated Math & Financial Fields**:
   - Dedicated "Calculate Formulas" (Single Form) and "Calculate All Formulas" (Batch Grid) buttons.
   - Safely computes sub-totals (`[Hours] * [Hourly Rate]`), logistics fees, taxes, and grand totals automatically without unsafe code evaluation.

4. **Dynamic Date & Currency Formatters**:
   - Built-in formatting filters:
     - `currency:USD`, `currency:GHS`, `currency:EUR`, `currency:GBP`, `currency:CREDITS`.
     - `words`: Converts numeric amounts to formal written English words (e.g. `45,000` $\rightarrow$ *"Forty-Five Thousand"*).
     - Standardized date formatting (`date:long`, `date:iso`).

5. **Smart Conditional Paragraph & Clause Guards**:
   - Interactive toggle switches allow users to selectively include or strike out entire optional paragraphs or legal clauses (such as warranty terms or auxiliary fee clauses) before generating final Word and PDF files.

6. **Page Budget Guard**:
   - Set a target page count (e.g., 2 pages). Real-time page budget counter in the realistic Word/PDF preview alerts you immediately if text inputs push the document over budget.

7. **Email Dispatch Modal & Local SMTP Integration**:
   - Review and send generated personalized PDFs directly to client inboxes with custom subject lines and bodies containing dynamic placeholder variables.
   - Uses local standard SMTP (TLS/SSL/Plain) with zero cloud vendor lock-in.

8. **Digital Signature Placeholder Anchor (`[Signature]` / `[Company Stamp]`)**:
   - Interactive HTML5 canvas with stylus and touch support to draw signatures, plus a transparent PNG upload tab.
   - Automatically embeds vector-clean signatures into Word tables and PDF pages directly replacing the placeholder anchor without shifting borders or margins.

9. **Multi-Template Workspace Drawer**:
   - Switch between preset templates (e.g., *Nova Vanguard Space Ranger Contract*) or custom uploads while retaining all recipient matrix rows, formulas, and digital signatures in the active session.

10. **Dual Previews (Interactive Live Markup & Realistic Word COM)**:
    - **Live Markup View**: Real-time reactive token substitution with visual tag highlighting.
    - **Realistic Word / PDF View**: High-resolution 130 DPI rasterized pages rendered via Microsoft Word COM with inline native browser viewing.

11. **Multi-Client Tabular Matrix (Batch Studio)**:
    - Responsive spreadsheet grid where rows correlate to individual clients so data is never cross-contaminated.
    - Direct **Copy & Paste** support from Microsoft Excel and Google Sheets.
    - **Export CSV Template** and **Import CSV / TSV** parser.
    - One-click batch generation packaged into an organized `.zip` bundle.

12. **Enterprise Security & Offline Privacy**:
    - Strict path traversal guards preventing directory escape.
    - XSS-safe HTML preview escaping.
    - Maximum upload size enforcement (50MB) and strict filetype whitelisting (`.docx`, `.pdf`).
    - 100% offline & private: zero external telemetry, zero cloud AI tokens, zero data leaving your machine.

---

## 🤖 Search, Answer & Generative Engine Optimization (SEO / AEO / GEO)

DocuForge is built with search and generative engine indexing in mind:
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
│   ├── main.py              # FastAPI REST server & path-safe inline PDF viewer
│   ├── processor.py         # Run-safe XML engine, bracket scanner, Word COM export
│   ├── samples/             # Bundled templates (Nova Vanguard Space Ranger Contract)
│   ├── output/              # Generated DOCX, PDF, and ZIP archives
│   └── static/              # Production React SPA build
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx              # App bar, theme toggle, drawer & signature triggers
│   │   │   ├── AboutModal.jsx          # About DocuForge, AEO/GEO FAQ & architecture
│   │   │   ├── FileDropzone.jsx        # Template upload for DOCX and PDF
│   │   │   ├── SingleForm.jsx          # Single document form with formula calculator & clauses
│   │   │   ├── BatchGrid.jsx           # Multi-client spreadsheet grid with batch formulas & email
│   │   │   ├── DocumentPreview.jsx     # Interactive live & realistic Word/PDF preview with budget guard
│   │   │   ├── CsvImportModal.jsx      # CSV/Excel batch data importer
│   │   │   ├── SignatureModal.jsx      # HTML5 canvas drawing & stamp PNG upload
│   │   │   ├── EmailDispatchModal.jsx  # Local SMTP email dispatcher with personalized variables
│   │   │   ├── TemplateDrawer.jsx      # Multi-template drawer retaining recipient data
│   │   │   └── WelcomeFeatures.jsx     # Capabilities & demo template launcher
│   │   ├── App.jsx                     # Root state & responsive layout
│   │   └── index.css                   # Executive palette (#00CED1) & tactile CSS
│   ├── public/
│   │   ├── robots.txt                  # SEO crawler directives
│   │   └── sitemap.xml                 # XML Sitemap
│   ├── index.html                      # SEO, AEO & GEO JSON-LD schemas
│   └── vite.config.js
├── LICENSE                  # MIT License (Mazonia 2026)
├── run.py                   # Python launcher
├── start.bat                # Windows one-click runner
└── README.md
```

---

## 📄 License
MIT License. Created by [Mazonia](https://github.com/Mazonia).
