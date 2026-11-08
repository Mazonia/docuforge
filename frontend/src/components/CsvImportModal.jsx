import React, { useState } from 'react';
import { X, UploadCloud, FileSpreadsheet, Check, AlertCircle } from 'lucide-react';

export default function CsvImportModal({ isOpen, onClose, onImport, template }) {
  const [pasteText, setPasteText] = useState('');
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const placeholders = template?.placeholders || [];

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setPasteText(content);
      }
    };
    reader.readAsText(file);
  };

  const parseData = () => {
    setError(null);
    if (!pasteText.trim()) {
      setError("Please paste some data or upload a CSV file.");
      return;
    }

    try {
      // Strip UTF-8 BOM if present
      const cleanPaste = pasteText.replace(/^\uFEFF/, '').trim();
      const lines = cleanPaste.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) {
        setError("Data must contain at least a header row and one data row.");
        return;
      }

      const firstLine = lines[0];
      let sep = ',';
      if (firstLine.includes('\t')) {
        sep = '\t';
      } else if (firstLine.includes(';') && !firstLine.includes(',')) {
        sep = ';';
      }

      const splitRow = (rowStr) => {
        if (sep === '\t') {
          return rowStr.split('\t').map(s => s.trim().replace(/^["']|["']$/g, ''));
        }
        // RFC 4180 standard CSV splitting handling quotes and escaped double quotes
        const result = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < rowStr.length; i++) {
          const char = rowStr[i];
          const next = rowStr[i + 1];
          if (char === '"') {
            if (inQuotes && next === '"') {
              cur += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === sep && !inQuotes) {
            result.push(cur.trim());
            cur = '';
          } else {
            cur += char;
          }
        }
        result.push(cur.trim());
        return result;
      };

      const headers = splitRow(lines[0]);
      
      const headerMap = {};
      headers.forEach((h, hIdx) => {
        const cleanH = h.toLowerCase().trim().replace(/[\[\]]/g, '');
        placeholders.forEach(p => {
          const cleanKey = p.key.toLowerCase().trim();
          if (cleanH === cleanKey || cleanH.includes(cleanKey) || cleanKey.includes(cleanH)) {
            headerMap[hIdx] = p.raw;
          }
        });
        if (cleanH.includes('label') || cleanH.includes('name') || cleanH.includes('client') || cleanH.includes('recipient')) {
          headerMap[hIdx] = headerMap[hIdx] || '__label__';
        }
      });

      const parsedRows = [];
      for (let i = 1; i < lines.length; i++) {
        const rowVals = splitRow(lines[i]);
        if (!rowVals || rowVals.length === 0) continue;

        let label = `Recipient ${i}`;
        const replacements = {};

        placeholders.forEach(p => {
          replacements[p.raw] = '';
        });

        rowVals.forEach((val, idx) => {
          const target = headerMap[idx];
          if (target === '__label__') {
            label = val;
          } else if (target) {
            replacements[target] = val;
          }
        });

        parsedRows.push({
          id: `row_import_${Date.now()}_${i}`,
          label,
          replacements
        });
      }

      if (parsedRows.length === 0) {
        setError("Could not parse any valid data rows.");
        return;
      }

      onImport(parsedRows, replaceExisting);
      onClose();
    } catch (err) {
      setError("Failed to parse data: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      
      <div className="rounded-2xl border w-full max-w-2xl overflow-hidden shadow-2xl transition-all animate-in zoom-in-95 duration-200"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)'
        }}>
        
        {/* Modal Header */}
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl"
              style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                Import CSV or Paste from Excel / Google Sheets
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Copy cells from Excel or Google Sheets and paste them directly below.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Paste Tabular Data (CSV or Tab-Separated)
              </label>
              <label className="text-xs font-medium cursor-pointer underline flex items-center space-x-1"
                style={{ color: 'var(--color-primary)' }}>
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload .CSV File</span>
                <input type="file" accept=".csv,.tsv,.txt" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <textarea
              rows={8}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={`Recipient Label,Ranger Unit Name,Rank and Last Name,Specialization Division,amount,X,payout timing\nAegis Recon,Aegis Recon Squadron 9,Commander Valeria Cross,Deep Space Plasma Interception,45000,6,24 hours\nSolaris Nebula,Solaris Nebula Explorers,Captain Jaxen Drake,Planetary Shielding,60000,8,12 hours`}
              className="w-full text-xs font-mono p-3 rounded-xl border focus:outline-none transition-all"
              style={{
                backgroundColor: 'var(--bg-subtle)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="replaceExisting"
              checked={replaceExisting}
              onChange={(e) => setReplaceExisting(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="replaceExisting" className="text-xs font-medium cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
              Replace existing table rows (otherwise append new rows)
            </label>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t flex items-center justify-end space-x-3"
          style={{
            backgroundColor: 'var(--bg-subtle)',
            borderColor: 'var(--border-color)'
          }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-tactile text-xs font-medium px-4 py-2 rounded-xl border transition-all"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)'
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={parseData}
            className="btn-tactile text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-sm"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: '#FFFFFF'
            }}
          >
            <Check className="w-3.5 h-3.5" />
            <span>Parse & Populate Grid</span>
          </button>
        </div>

      </div>

    </div>
  );
}
