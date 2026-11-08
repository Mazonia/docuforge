import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Download, 
  FolderOpen, 
  CheckCircle2, 
  RefreshCw, 
  Eye, 
  FileSpreadsheet, 
  Archive, 
  Sparkles, 
  Info,
  Calculator,
  Mail,
  PenTool
} from 'lucide-react';
import EmailDispatchModal from './EmailDispatchModal';
import SignatureModal from './SignatureModal';

export default function BatchGrid({
  template,
  rows,
  setRows,
  activeRowIndex,
  setActiveRowIndex,
  onGenerateBatch,
  isGeneratingBatch,
  batchResult,
  onOpenFolder,
  onOpenCsvModal,
  onOpenAddPlaceholderModal,
  globalSignature,
  setGlobalSignature
}) {
  const [batchTitle, setBatchTitle] = useState('Vanguard_Orbital_Ranger_Batch');
  const [format, setFormat] = useState('both');
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isSigModalOpen, setIsSigModalOpen] = useState(false);

  const placeholders = template?.placeholders || [];

  // Batch Formula Calculation Engine (Suggestion 2)
  const handleCalculateAllRows = () => {
    setRows(prevRows => {
      return prevRows.map(row => {
        const updatedReplacements = { ...row.replacements };
        let hours = 0;
        let rate = 0;
        let amount = 0;
        let feePct = 0;

        for (const [k, v] of Object.entries(updatedReplacements)) {
          const valStr = String(v).replace(/[^0-9.]/g, '');
          const num = parseFloat(valStr);
          if (isNaN(num)) continue;

          const kl = k.toLowerCase();
          if (kl.includes('hour') && !kl.includes('rate')) hours = num;
          else if (kl.includes('rate')) rate = num;
          else if (kl.includes('amount') || kl.includes('subtotal') || kl.includes('bounty')) amount = num;
          else if (kl.includes('fee') || kl.includes('surcharge') || kl.includes('[x]')) feePct = num;
        }

        const calculatedSubtotal = (hours > 0 && rate > 0) ? (hours * rate) : (amount || 45000);
        const calculatedFee = (feePct > 0) ? (calculatedSubtotal * (feePct / 100)) : 0;
        const calculatedTotal = calculatedSubtotal + calculatedFee;

        placeholders.forEach(p => {
          const pl = p.key.toLowerCase();
          if ((pl.includes('total') || pl.includes('payout')) && !pl.includes('timing')) {
            updatedReplacements[p.raw] = calculatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          } else if (pl.includes('amount') && hours > 0 && rate > 0) {
            updatedReplacements[p.raw] = calculatedSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          }
        });

        return {
          ...row,
          replacements: updatedReplacements
        };
      });
    });
  };

  // Build clean column descriptors with tailored widths based on data type
  const tableColumns = placeholders.map(p => {
    let cleanHeader = p.label || p.key;
    let colWidthClass = "min-w-[150px]";

    // Tailored widths according to content length
    const lowerKey = p.key.toLowerCase();
    if (p.is_clause) {
      if (lowerKey.includes('is free') || lowerKey.includes('setup fee')) {
        cleanHeader = 'Setup Fee Terms';
        colWidthClass = "min-w-[240px]";
      } else if (lowerKey.includes('service fee') || lowerKey.includes('deducts')) {
        cleanHeader = 'Commission Rate';
        colWidthClass = "min-w-[200px]";
      } else if (lowerKey.includes('payout') || lowerKey.includes('transfer')) {
        cleanHeader = 'Payout Schedule';
        colWidthClass = "min-w-[200px]";
      } else {
        colWidthClass = "min-w-[220px]";
      }
    } else if (p.key.trim() === 'X' || p.key.trim() === '[X]') {
      colWidthClass = "w-20 min-w-[70px]";
    } else if (lowerKey.includes('amount') || lowerKey.includes('fee') || lowerKey.includes('price')) {
      colWidthClass = "w-28 min-w-[100px]";
    } else if (lowerKey.includes('timing') || lowerKey.includes('date')) {
      colWidthClass = "w-32 min-w-[120px]";
    } else if (lowerKey.includes('service')) {
      colWidthClass = "min-w-[160px]";
    } else if (lowerKey.includes('business') || lowerKey.includes('company')) {
      colWidthClass = "min-w-[170px]";
    } else if (lowerKey.includes('name')) {
      colWidthClass = "min-w-[150px]";
    }

    return {
      raw: p.raw,
      key: p.key,
      headerTitle: cleanHeader,
      widthClass: colWidthClass,
      isClause: p.is_clause,
      isConditional: p.is_conditional,
      options: p.options || []
    };
  });

  const handleCellChange = (rowIndex, rawKey, value) => {
    setRows(prev => {
      const updated = [...prev];
      updated[rowIndex] = {
        ...updated[rowIndex],
        replacements: {
          ...updated[rowIndex].replacements,
          [rawKey]: value
        }
      };
      return updated;
    });
  };

  const handleLabelChange = (rowIndex, label) => {
    setRows(prev => {
      const updated = [...prev];
      updated[rowIndex] = {
        ...updated[rowIndex],
        label
      };
      return updated;
    });
  };

  const addRow = () => {
    const newId = `row_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const emptyReplacements = {};
    placeholders.forEach(p => {
      emptyReplacements[p.raw] = '';
    });
    setRows(prev => [
      ...prev,
      {
        id: newId,
        label: `Vendor ${prev.length + 1}`,
        replacements: emptyReplacements
      }
    ]);
    setActiveRowIndex(rows.length);
  };

  const duplicateRow = (index) => {
    const source = rows[index];
    const newRow = {
      id: `row_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      label: `${source.label || 'Client'} (Copy)`,
      replacements: { ...source.replacements }
    };
    setRows(prev => {
      const updated = [...prev];
      updated.splice(index + 1, 0, newRow);
      return updated;
    });
  };

  const deleteRow = (index) => {
    if (rows.length <= 1) {
      alert("At least one recipient row must be kept.");
      return;
    }
    setRows(prev => prev.filter((_, i) => i !== index));
    if (activeRowIndex >= rows.length - 1) {
      setActiveRowIndex(Math.max(0, rows.length - 2));
    }
  };

  const loadSampleVendors = () => {
    const sampleRows = [
      {
        id: 'rec_1',
        label: 'Aegis Recon Squadron 9',
        replacements: {
          '[Ranger Unit Name]': 'Aegis Recon Squadron 9',
          '[Rank and Last Name]': 'Commander Valeria Cross',
          '[Specialization Division]': 'Deep Space Plasma Interception',
          '[Assigned Star Sector]': 'Kepler Outpost Sector 4',
          '[Vessel Class]': 'Vanguard Hyper-Cruiser MK-IV',
          '[amount]': '45,000',
          '[X]': '6',
          '[payout timing]': '24 hours',
          '[is fully subsidized by Galactic Council / carries an auxiliary warp-cell surcharge of [amount] Credits]': 'carries an auxiliary warp-cell surcharge of 45,000 Credits',
          '[deducts a spaceport logistics fee of [X]% from each completed mission payout]': 'deducts a spaceport logistics fee of 6% from each completed mission payout',
          '[by quantum hyper-relay or sub-space credit transfer, within [payout timing] of debriefing approval]': 'by quantum hyper-relay or sub-space credit transfer, within 24 hours of debriefing approval'
        }
      },
      {
        id: 'rec_2',
        label: 'Solaris Nebula Explorers',
        replacements: {
          '[Ranger Unit Name]': 'Solaris Nebula Explorers',
          '[Rank and Last Name]': 'Captain Jaxen Drake',
          '[Specialization Division]': 'Planetary Shielding & Escort',
          '[Assigned Star Sector]': 'Orion Gateway Sector 7',
          '[Vessel Class]': 'Orbital Interceptor Class-A',
          '[amount]': '60,000',
          '[X]': '8',
          '[payout timing]': '12 hours',
          '[is fully subsidized by Galactic Council / carries an auxiliary warp-cell surcharge of [amount] Credits]': 'is fully subsidized by Galactic Council',
          '[deducts a spaceport logistics fee of [X]% from each completed mission payout]': 'deducts a spaceport logistics fee of 8% from each completed mission payout',
          '[by quantum hyper-relay or sub-space credit transfer, within [payout timing] of debriefing approval]': 'by quantum hyper-relay or sub-space credit transfer, within 12 hours of debriefing approval'
        }
      },
      {
        id: 'rec_3',
        label: 'Hyperion Void Walkers',
        replacements: {
          '[Ranger Unit Name]': 'Hyperion Void Walkers',
          '[Rank and Last Name]': 'Lieutenant Kira Vance',
          '[Specialization Division]': 'Asteroid Hazard Demolition',
          '[Assigned Star Sector]': 'Proxima Centauri Alpha',
          '[Vessel Class]': 'Quantum Dreadnought EX',
          '[amount]': '35,000',
          '[X]': '5',
          '[payout timing]': '48 hours',
          '[is fully subsidized by Galactic Council / carries an auxiliary warp-cell surcharge of [amount] Credits]': 'carries an auxiliary warp-cell surcharge of 35,000 Credits',
          '[deducts a spaceport logistics fee of [X]% from each completed mission payout]': 'deducts a spaceport logistics fee of 5% from each completed mission payout',
          '[by quantum hyper-relay or sub-space credit transfer, within [payout timing] of debriefing approval]': 'by quantum hyper-relay or sub-space credit transfer, within 48 hours of debriefing approval'
        }
      },
      {
        id: 'rec_4',
        label: 'Apex Orbital Vanguard',
        replacements: {
          '[Ranger Unit Name]': 'Apex Orbital Vanguard',
          '[Rank and Last Name]': 'Officer Jax Morgan',
          '[Specialization Division]': 'Deep Space Communications & Relay',
          '[Assigned Star Sector]': 'Sirius Void Sector 9',
          '[Vessel Class]': 'Stealth Frigate SF-2',
          '[amount]': '50,000',
          '[X]': '7',
          '[payout timing]': '24 hours',
          '[is fully subsidized by Galactic Council / carries an auxiliary warp-cell surcharge of [amount] Credits]': 'carries an auxiliary warp-cell surcharge of 50,000 Credits',
          '[deducts a spaceport logistics fee of [X]% from each completed mission payout]': 'deducts a spaceport logistics fee of 7% from each completed mission payout',
          '[by quantum hyper-relay or sub-space credit transfer, within [payout timing] of debriefing approval]': 'by quantum hyper-relay or sub-space credit transfer, within 24 hours of debriefing approval'
        }
      }
    ];
    setRows(sampleRows);
    setActiveRowIndex(0);
  };

  const handleExportCsvTemplate = async () => {
    try {
      const resp = await fetch('/api/export-csv-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeholders })
      });
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.filename.replace(/\.[^/.]+$/, "")}_batch_template.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert("Failed to export CSV template: " + err.message);
    }
  };

  const handleSubmitBatch = (e) => {
    e.preventDefault();
    if (!rows.length) {
      alert("Please add at least one recipient row.");
      return;
    }
    onGenerateBatch({
      template_path: template.filepath,
      batch_title: batchTitle,
      format,
      records: rows
    });
  };

  return (
    <div className="space-y-6">
      <EmailDispatchModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        records={batchResult?.records || rows}
      />

      <SignatureModal
        isOpen={isSigModalOpen}
        onClose={() => setIsSigModalOpen(false)}
        onSave={(sig) => setGlobalSignature && setGlobalSignature(sig)}
        currentSignature={globalSignature}
      />
      
      {/* Batch Control Toolbar */}
      <div className="p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)'
        }}>
        
        {/* Left Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={addRow}
            className="btn-tactile text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-sm cursor-pointer"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: '#FFFFFF'
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Recipient Row</span>
          </button>

          <button
            type="button"
            onClick={loadSampleVendors}
            className="btn-tactile text-xs font-medium px-3.5 py-2 rounded-xl border flex items-center space-x-1.5 transition-all cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-subtle)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)'
            }}
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--color-secondary)' }} />
            <span>Load Sample Squadrons</span>
          </button>

          {/* Calculate All Formulas (Suggestion 2) */}
          <button
            type="button"
            onClick={handleCalculateAllRows}
            className="btn-tactile text-xs font-semibold px-3.5 py-2 rounded-xl border flex items-center space-x-1.5 transition-all cursor-pointer bg-[#00CED1]/15 border-[#00CED1] text-[#00CED1] hover:bg-[#00CED1]/25"
            title="Calculate math formulas across all rows"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Calculate All Formulas</span>
          </button>

          {/* Global Signature (Suggestion 8) */}
          <button
            type="button"
            onClick={() => setIsSigModalOpen(true)}
            className={`btn-tactile text-xs font-semibold px-3 py-2 rounded-xl border flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer ${
              globalSignature 
                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-[#00CED1]'
            }`}
            title="Set global signature for all batch documents"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>{globalSignature ? 'Batch Signed' : 'Sign Batch'}</span>
          </button>

          {/* Email Dispatch Trigger (Suggestion 6) */}
          <button
            type="button"
            onClick={() => setIsEmailModalOpen(true)}
            className="btn-tactile text-xs font-semibold px-3.5 py-2 rounded-xl border flex items-center space-x-1.5 transition-all cursor-pointer bg-slate-800 border-slate-700 text-slate-200 hover:border-[#00CED1]"
            title="Dispatch generated batch PDFs via email/SMTP"
          >
            <Mail className="w-3.5 h-3.5 text-[#00CED1]" />
            <span>Email Dispatch</span>
          </button>

          <button
            type="button"
            onClick={onOpenCsvModal}
            className="btn-tactile text-xs font-medium px-3.5 py-2 rounded-xl border flex items-center space-x-1.5 transition-all cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-subtle)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)'
            }}
            title="Import CSV or Paste directly from Excel/Google Sheets"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Import / Paste CSV</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddPlaceholderModal}
            className="btn-tactile text-xs font-medium px-3.5 py-2 rounded-xl border flex items-center space-x-1.5 transition-all cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-subtle)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)'
            }}
            title="Add a custom placeholder from exact document words"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Placeholder</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={handleExportCsvTemplate}
            className="text-xs font-medium px-2 py-1 rounded-lg flex items-center space-x-1 transition-colors"
            style={{ color: 'var(--color-primary)' }}
            title="Download CSV spreadsheet template with headers"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CSV Template</span>
          </button>

          <span style={{ color: 'var(--border-color)' }}>|</span>

          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
            {rows.length} {rows.length === 1 ? 'Recipient' : 'Recipients'}
          </span>
        </div>

      </div>

      {/* Responsive Spreadsheet Grid */}
      <div className="rounded-2xl border shadow-sm overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)'
        }}>
        
        <div className="overflow-x-auto max-h-[540px]">
          <table className="w-full text-left border-collapse text-xs">
            
            {/* Table Header with Clean Non-Repeated Titles & Content-Aware Sizing */}
            <thead className="sticky top-0 z-20 backdrop-blur-md"
              style={{
                backgroundColor: 'var(--bg-subtle)',
                borderBottom: '1px solid var(--border-color)'
              }}>
              <tr>
                <th className="py-3 px-3 w-10 text-center font-bold" style={{ color: 'var(--text-muted)' }}>
                  #
                </th>
                <th className="py-3 px-3 min-w-[150px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                  Recipient Label
                </th>
                {tableColumns.map((col) => (
                  <th key={col.raw} className={`py-3 px-3 font-bold ${col.widthClass}`}>
                    <div className="flex items-center space-x-1.5" title={col.raw}>
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {col.headerTitle}
                      </span>
                      <Info className="w-3 h-3 opacity-40 shrink-0" />
                    </div>
                  </th>
                ))}
                <th className="py-3 px-3 w-24 text-center font-bold" style={{ color: 'var(--text-secondary)' }}>
                  Actions
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
              {rows.map((row, rIdx) => {
                const isActive = rIdx === activeRowIndex;

                return (
                  <tr
                    key={row.id}
                    className={`transition-colors ${
                      isActive ? 'bg-[var(--color-primary-light)]/40' : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Index */}
                    <td className="py-2.5 px-3 text-center font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {rIdx + 1}
                    </td>

                    {/* Recipient Label */}
                    <td className="py-2 px-3">
                      <div className="flex items-center space-x-1.5">
                        <input
                          type="text"
                          value={row.label || ''}
                          onChange={(e) => handleLabelChange(rIdx, e.target.value)}
                          placeholder={`Client ${rIdx + 1}`}
                          className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border focus:outline-none transition-all"
                          style={{
                            backgroundColor: 'var(--bg-card)',
                            borderColor: isActive ? 'var(--color-primary)' : 'var(--border-color)',
                            color: 'var(--text-primary)'
                          }}
                        />
                        {isActive && (
                          <span 
                            className="shrink-0 p-1 rounded"
                            style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                            title="Active live preview row"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Placeholder Columns */}
                    {tableColumns.map((col) => {
                      const val = row.replacements?.[col.raw] !== undefined ? row.replacements[col.raw] : '';

                      // Conditional Column Rendering: Dropdown + Text
                      if (col.isConditional) {
                        return (
                          <td key={col.raw} className={`py-2 px-3 ${col.widthClass}`}>
                            <div className="flex flex-col gap-1">
                              <select
                                value={
                                  val.startsWith('is free') 
                                    ? 'free' 
                                    : val.startsWith('carries a setup fee') 
                                      ? 'fee' 
                                      : 'custom'
                                }
                                onChange={(e) => {
                                  const sel = e.target.value;
                                  if (sel === 'free') {
                                    handleCellChange(rIdx, col.raw, 'is free');
                                  } else if (sel === 'fee') {
                                    const amountVal = row.replacements?.['[amount]'] || '150.00';
                                    handleCellChange(rIdx, col.raw, `carries a setup fee of GHS ${amountVal}`);
                                  }
                                }}
                                className="w-full text-[11px] px-2 py-1 rounded-md border focus:outline-none font-medium"
                                style={{
                                  backgroundColor: 'var(--bg-subtle)',
                                  borderColor: 'var(--border-color)',
                                  color: 'var(--text-primary)'
                                }}
                              >
                                <option value="free">Option: Free Setup</option>
                                <option value="fee">Option: Setup Fee</option>
                                <option value="custom">Custom Clause</option>
                              </select>

                              <input
                                type="text"
                                value={val}
                                onChange={(e) => handleCellChange(rIdx, col.raw, e.target.value)}
                                placeholder="Clause text..."
                                className="w-full text-xs px-2 py-1 rounded-lg border focus:outline-none transition-all"
                                style={{
                                  backgroundColor: 'var(--bg-card)',
                                  borderColor: 'var(--border-color)',
                                  color: 'var(--text-primary)'
                                }}
                              />
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td key={col.raw} className={`py-2 px-3 ${col.widthClass}`}>
                          <input
                            type="text"
                            value={val}
                            onChange={(e) => handleCellChange(rIdx, col.raw, e.target.value)}
                            placeholder={`Enter ${col.headerTitle}`}
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border focus:outline-none transition-all"
                            style={{
                              backgroundColor: 'var(--bg-card)',
                              borderColor: 'var(--border-color)',
                              color: 'var(--text-primary)'
                            }}
                          />
                        </td>
                      );
                    })}

                    {/* Row Actions */}
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          type="button"
                          onClick={() => setActiveRowIndex(rIdx)}
                          className="p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          style={{ borderColor: 'var(--border-color)' }}
                          title="Preview this client's document"
                        >
                          <Eye className="w-3.5 h-3.5" style={{ color: 'var(--color-primary)' }} />
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateRow(rIdx)}
                          className="p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          style={{ borderColor: 'var(--border-color)' }}
                          title="Duplicate row"
                        >
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteRow(rIdx)}
                          className="p-1.5 rounded-lg border hover:bg-red-50 dark:hover:bg-red-950 transition-colors cursor-pointer"
                          style={{ borderColor: 'var(--border-color)' }}
                          title="Delete row"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>

          </table>
        </div>

      </div>

      {/* Batch Generation Submission Bar */}
      <form onSubmit={handleSubmitBatch} className="p-5 rounded-2xl border shadow-xs space-y-4"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)'
        }}>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Batch Package Title / Export Folder Name
            </label>
            <input
              type="text"
              value={batchTitle}
              onChange={(e) => setBatchTitle(e.target.value)}
              placeholder="e.g. Vanguard_Orbital_Ranger_Batch_1"
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border focus:outline-none transition-all"
              style={{
                backgroundColor: 'var(--bg-subtle)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Export Format
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border focus:outline-none transition-all"
              style={{
                backgroundColor: 'var(--bg-subtle)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="both">Both DOCX & Native PDF</option>
              <option value="pdf">PDF Only</option>
              <option value="docx">Word (.docx) Only</option>
            </select>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Each row generates an independent customized document. All generated files will be packaged into a tidy ZIP archive.
          </p>

          <button
            type="submit"
            disabled={isGeneratingBatch}
            className="btn-tactile w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-xs tracking-wide shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: '#FFFFFF'
            }}
          >
            {isGeneratingBatch ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating {rows.length} Client Documents...</span>
              </>
            ) : (
              <>
                <Archive className="w-4 h-4" />
                <span>Generate Batch Package ({rows.length} Docs)</span>
              </>
            )}
          </button>
        </div>

      </form>

      {/* Batch Generation Success Banner */}
      {batchResult && (
        <div className="p-5 rounded-2xl border shadow-sm transition-all animate-in fade-in space-y-4"
          style={{
            backgroundColor: 'var(--color-secondary-light)',
            borderColor: 'var(--color-secondary)'
          }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--color-secondary)' }} />
              <div>
                <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  Batch Generation Complete! ({batchResult.total_files} Files Generated)
                </h4>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Successfully compiled {batchResult.total_records} client documents into archive: <span className="font-semibold">{batchResult.batch_title}.zip</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <a
                href={batchResult.zip_download_url}
                download
                className="btn-tactile text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow-sm"
                style={{
                  backgroundColor: 'var(--color-secondary)',
                  color: '#FFFFFF'
                }}
              >
                <Download className="w-4 h-4" />
                <span>Download All (.ZIP Bundle)</span>
              </a>

              <button
                type="button"
                onClick={onOpenFolder}
                className="btn-tactile text-xs font-medium px-3.5 py-2.5 rounded-xl border flex items-center space-x-1.5"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-secondary)'
                }}
              >
                <FolderOpen className="w-4 h-4" />
                <span>Open Folder</span>
              </button>
            </div>

          </div>

          {/* Generated Documents List */}
          {batchResult.records && batchResult.records.length > 0 && (
            <div className="pt-3 border-t" style={{ borderColor: 'rgba(5, 150, 105, 0.2)' }}>
              <span className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-secondary)' }}>
                Generated Individual Files:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {batchResult.records.map((r, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl border flex items-center justify-between"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-color)'
                    }}>
                    <span className="text-xs font-medium truncate max-w-[140px]" style={{ color: 'var(--text-primary)' }}>
                      {r.label}
                    </span>
                    <div className="flex items-center space-x-1 shrink-0">
                      {r.docx && (
                        <a
                          href={`/api/download/${r.docx}`}
                          download
                          className="px-2 py-0.5 rounded text-[10px] font-bold border transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                          style={{ color: 'var(--color-primary)', borderColor: 'var(--border-color)' }}
                        >
                          DOCX
                        </a>
                      )}
                      {r.pdf && (
                        <div className="flex items-center space-x-1">
                          <a
                            href={`/api/view-pdf/${r.pdf}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 rounded text-[10px] font-bold border transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950 flex items-center space-x-1"
                            style={{ color: 'var(--color-secondary)', borderColor: 'var(--border-color)' }}
                            title="Open PDF directly in browser"
                          >
                            <Eye className="w-2.5 h-2.5" />
                            <span>PDF</span>
                          </a>
                          <a
                            href={`/api/download/${r.pdf}`}
                            download
                            className="p-1 rounded text-[10px] border transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                            style={{ color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}
                            title="Download PDF"
                          >
                            <Download className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
