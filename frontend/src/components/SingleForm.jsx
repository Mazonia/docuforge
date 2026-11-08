import React, { useState, useEffect } from 'react';
import { 
  FileDown, 
  Sparkles, 
  CheckCircle2, 
  Download, 
  FolderOpen, 
  RefreshCw, 
  Info,
  ChevronDown,
  ChevronUp,
  Tag,
  Plus,
  ExternalLink,
  Calculator,
  PenTool,
  ToggleLeft,
  ToggleRight,
  EyeOff
} from 'lucide-react';
import SignatureModal from './SignatureModal';

export default function SingleForm({ 
  template, 
  replacements, 
  setReplacements, 
  onGenerate, 
  isGenerating, 
  generationResult,
  onOpenFolder,
  onOpenAddPlaceholderModal,
  signatureDataUrl,
  setSignatureDataUrl,
  hiddenClauses = [],
  setHiddenClauses
}) {
  const [docTitle, setDocTitle] = useState('Vanguard Mission - Aegis Recon');
  const [format, setFormat] = useState('both');
  const [showSnippets, setShowSnippets] = useState({});
  const [conditionalModes, setConditionalModes] = useState({});
  const [isSigModalOpen, setIsSigModalOpen] = useState(false);

  const placeholders = template?.placeholders || [];

  // Formula Calculation Engine (Suggestion 2)
  const handleCalculateFormulas = () => {
    setReplacements(prev => {
      const updated = { ...prev };
      
      // Look for rate/hours/subtotal/fee values
      let hours = 0;
      let rate = 0;
      let amount = 0;
      let feePct = 0;

      for (const [k, v] of Object.entries(updated)) {
        const valStr = String(v).replace(/[^0-9.]/g, '');
        const num = parseFloat(valStr);
        if (isNaN(num)) continue;

        const kl = k.toLowerCase();
        if (kl.includes('hour') && !kl.includes('rate')) hours = num;
        else if (kl.includes('rate')) rate = num;
        else if (kl.includes('amount') || kl.includes('subtotal') || kl.includes('bounty')) amount = num;
        else if (kl.includes('fee') || kl.includes('surcharge') || kl.includes('[x]')) feePct = num;
      }

      // Calculate any empty or target formula fields
      const calculatedSubtotal = (hours > 0 && rate > 0) ? (hours * rate) : (amount || 45000);
      const calculatedFee = (feePct > 0) ? (calculatedSubtotal * (feePct / 100)) : 0;
      const calculatedTotal = calculatedSubtotal + calculatedFee;

      // Update placeholders matching total / amount / payout
      placeholders.forEach(p => {
        const pl = p.key.toLowerCase();
        if ((pl.includes('total') || pl.includes('payout')) && !pl.includes('timing')) {
          updated[p.raw] = calculatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else if (pl.includes('amount') && hours > 0 && rate > 0) {
          updated[p.raw] = calculatedSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
      });

      return updated;
    });
  };

  // Toggle optional clause visibility (Suggestion 4)
  const toggleClause = (clauseTitle) => {
    if (!setHiddenClauses) return;
    setHiddenClauses(prev => 
      prev.includes(clauseTitle) 
        ? prev.filter(c => c !== clauseTitle)
        : [...prev, clauseTitle]
    );
  };

  // When amount or X changes, auto-update conditional clauses if linked
  useEffect(() => {
    placeholders.forEach(field => {
      if (field.is_conditional && conditionalModes[field.raw] === 'option_1') {
        const amountVal = replacements['[amount]'] || '45,000';
        const formatted = `carries an auxiliary warp-cell surcharge of ${amountVal} Credits`;
        if (replacements[field.raw] !== formatted) {
          setReplacements(prev => ({ ...prev, [field.raw]: formatted }));
        }
      }
    });
  }, [replacements['[amount]'], conditionalModes]);

  // Built-in Space Ranger Presets
  const presets = [
    {
      name: 'Aegis Recon Squadron 9',
      title: 'Vanguard Assignment - Aegis Recon Squadron 9',
      data: {
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
      name: 'Solaris Nebula Explorers',
      title: 'Vanguard Assignment - Solaris Nebula Explorers',
      data: {
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
      name: 'Hyperion Void Walkers',
      title: 'Vanguard Assignment - Hyperion Void Walkers',
      data: {
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
    }
  ];

  const applyPreset = (preset) => {
    setDocTitle(preset.title);
    setReplacements(preset.data);
  };

  const handleInputChange = (rawKey, val) => {
    setReplacements(prev => ({
      ...prev,
      [rawKey]: val
    }));
  };

  const handleConditionalChoice = (rawKey, choiceType, customValue) => {
    setConditionalModes(prev => ({ ...prev, [rawKey]: choiceType }));
    if (choiceType === 'is_free') {
      handleInputChange(rawKey, 'is free');
    } else if (choiceType === 'fee') {
      const amountVal = replacements['[amount]'] || '150.00';
      handleInputChange(rawKey, `carries a setup fee of GHS ${amountVal}`);
    } else if (choiceType === 'custom') {
      handleInputChange(rawKey, customValue || '');
    }
  };

  const handleFillDefaults = () => {
    const defaults = {};
    placeholders.forEach(p => {
      defaults[p.raw] = p.suggested || '';
    });
    setReplacements(defaults);
  };

  const handleClear = () => {
    setReplacements({});
  };

  const toggleSnippet = (raw) => {
    setShowSnippets(prev => ({ ...prev, [raw]: !prev[raw] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerate({
      template_path: template.filepath,
      doc_title: docTitle,
      format,
      replacements,
      signature_data_url: signatureDataUrl,
      hidden_clauses: hiddenClauses
    });
  };

  return (
    <div className="space-y-6">
      <SignatureModal
        isOpen={isSigModalOpen}
        onClose={() => setIsSigModalOpen(false)}
        onSave={(sig) => setSignatureDataUrl && setSignatureDataUrl(sig)}
        currentSignature={signatureDataUrl}
      />
      
      {/* Presets & Actions Bar */}
      <div className="p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)'
        }}>
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
            Quick Presets:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(p)}
                className="btn-tactile text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-secondary)'
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* Calculate Formulas Button (Suggestion 2) */}
          <button
            type="button"
            onClick={handleCalculateFormulas}
            className="btn-tactile text-xs font-semibold px-3 py-1.5 rounded-lg border flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer bg-[#00CED1]/15 border-[#00CED1] text-[#00CED1] hover:bg-[#00CED1]/25"
            title="Click to calculate mathematical and financial fields"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Calculate Formulas</span>
          </button>

          {/* Attach Signature Button (Suggestion 8) */}
          <button
            type="button"
            onClick={() => setIsSigModalOpen(true)}
            className={`btn-tactile text-xs font-semibold px-3 py-1.5 rounded-lg border flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer ${
              signatureDataUrl 
                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-[#00CED1]'
            }`}
            title="Draw or upload digital signature"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>{signatureDataUrl ? 'Signature Attached' : 'Attach Signature'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddPlaceholderModal}
            className="btn-tactile text-xs font-semibold px-3 py-1.5 rounded-lg border flex items-center space-x-1.5 transition-all shadow-xs"
            style={{
              backgroundColor: 'var(--color-primary-light)',
              borderColor: 'var(--color-primary)',
              color: 'var(--color-primary)'
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Placeholder</span>
          </button>
          
          <button
            type="button"
            onClick={handleFillDefaults}
            className="text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            style={{ color: 'var(--color-primary)' }}
          >
            Auto-Fill Suggestions
          </button>
          <span style={{ color: 'var(--border-color)' }}>|</span>
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors hover:text-red-500 cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Output Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-2xl border shadow-xs"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)'
          }}>
          
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Output Document Name / Client Title
            </label>
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="e.g. Vanguard Assignment - Aegis Recon"
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

        {/* Smart Conditional Clauses (Include / Exclude - Suggestion 4) */}
        <div className="p-4 rounded-2xl border bg-slate-950/40 border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <EyeOff size={13} className="text-[#00CED1]" /> Optional Paragraph & Clause Guards
            </span>
            <span className="text-[11px] text-slate-500">Toggle inclusion in generated doc</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {[
              { id: 'warp_cell', label: 'Auxiliary Warp-Cell Surcharge Clause' },
              { id: 'spaceport_fee', label: 'Spaceport Logistics Demolition Fee Clause' }
            ].map(clause => {
              const isExcluded = hiddenClauses.includes(clause.label);
              return (
                <div
                  key={clause.id}
                  onClick={() => toggleClause(clause.label)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    !isExcluded 
                      ? 'bg-slate-900 border-slate-700 text-slate-200' 
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300 line-through opacity-75'
                  }`}
                >
                  <span className="text-xs font-medium">{clause.label}</span>
                  {!isExcluded ? (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Included</span>
                  ) : (
                    <span className="text-[10px] font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded">Excluded</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Fields List */}
        <div className="rounded-2xl border p-5 shadow-xs space-y-4"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)'
          }}>
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div>
              <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                Template Fields & Conditions
              </h4>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Customize client variables, dates, currency, and conditional statements below.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
              {placeholders.length} Fields
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {placeholders.map((field) => {
              const val = replacements[field.raw] !== undefined ? replacements[field.raw] : '';
              const isClause = field.is_clause;
              const isConditional = field.is_conditional;
              const hasSnippets = field.snippets && field.snippets.length > 0;
              const isSnippetOpen = showSnippets[field.raw];

              return (
                <div 
                  key={field.raw} 
                  className={`p-3.5 rounded-xl border transition-all ${
                    isClause ? 'md:col-span-2' : ''
                  }`}
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    borderColor: 'var(--border-color)'
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold flex items-center space-x-1.5" style={{ color: 'var(--text-primary)' }}>
                      <span>{field.label || field.key}</span>
                      {field.occurrences > 1 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md"
                          style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent)' }}>
                          {field.occurrences}x in doc
                        </span>
                      )}
                      {field.is_custom && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md"
                          style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                          Custom Field
                        </span>
                      )}
                      {isConditional && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md"
                          style={{ backgroundColor: 'var(--color-secondary-light)', color: 'var(--color-secondary)' }}>
                          Conditional (2 Options)
                        </span>
                      )}
                    </label>

                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] font-mono opacity-60 truncate max-w-[180px]" style={{ color: 'var(--text-muted)' }}>
                        {field.raw}
                      </span>
                      {hasSnippets && (
                        <button
                          type="button"
                          onClick={() => toggleSnippet(field.raw)}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          title="View context snippet"
                        >
                          {isSnippetOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Context Snippet Drawer */}
                  {isSnippetOpen && hasSnippets && (
                    <div className="mb-2 p-2 rounded-lg text-[11px] border font-mono italic"
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-secondary)'
                      }}>
                      {field.snippets.map((snip, sIdx) => (
                        <div key={sIdx} className="line-clamp-2">
                          {snip}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Input Rendering: Conditional Dropdown vs Normal Input */}
                  {isConditional ? (
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <select
                          value={
                            val.startsWith('is fully subsidized') 
                              ? 'subsidized' 
                              : val.startsWith('carries an auxiliary') 
                                ? 'surcharge' 
                                : 'custom'
                          }
                          onChange={(e) => {
                            if (e.target.value === 'subsidized') {
                              handleInputChange(field.raw, 'is fully subsidized by Galactic Council');
                            } else if (e.target.value === 'surcharge') {
                              const amountVal = replacements['[amount]'] || '45,000';
                              handleInputChange(field.raw, `carries an auxiliary warp-cell surcharge of ${amountVal} Credits`);
                            }
                          }}
                          className="text-xs px-3 py-2 rounded-lg border focus:outline-none transition-all font-medium cursor-pointer"
                          style={{
                            backgroundColor: 'var(--bg-card)',
                            borderColor: 'var(--border-color)',
                            color: 'var(--text-primary)'
                          }}
                        >
                          <option value="surcharge">Option 1: Auxiliary Warp-Cell Surcharge ({replacements['[amount]'] || '45,000'} Credits)</option>
                          <option value="subsidized">Option 2: Fully Subsidized by Galactic Council</option>
                          <option value="custom">Custom Condition / Clause...</option>
                        </select>
                      </div>

                      {/* Display / Editable clause text */}
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => handleInputChange(field.raw, e.target.value)}
                        placeholder="Enter custom condition text..."
                        className="w-full text-xs px-3 py-2 rounded-lg border focus:outline-none transition-all"
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-primary)'
                        }}
                      />
                    </div>
                  ) : isClause ? (
                    <textarea
                      rows={2}
                      value={val}
                      onChange={(e) => handleInputChange(field.raw, e.target.value)}
                      placeholder={`Enter custom clause or leave default: ${field.suggested}`}
                      className="w-full text-xs px-3 py-2 rounded-lg border focus:outline-none transition-all"
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  ) : (
                    <input
                      type={field.type === 'number' ? 'text' : field.type}
                      value={val}
                      onChange={(e) => handleInputChange(field.raw, e.target.value)}
                      placeholder={field.suggested || `Value for ${field.key}`}
                      className="w-full text-xs px-3 py-2 rounded-lg border focus:outline-none transition-all"
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Submit CTA */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Generates pixel-perfect document using native Word layout and exports directly to PDF.
            </p>

            <button
              type="submit"
              disabled={isGenerating}
              className="btn-tactile w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-xs tracking-wide shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: '#FFFFFF'
              }}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating Word & PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Generate Document</span>
                </>
              )}
            </button>
          </div>

        </div>

      </form>

      {/* Generation Result Card */}
      {generationResult && (
        <div className="p-5 rounded-2xl border shadow-sm transition-all animate-in fade-in"
          style={{
            backgroundColor: 'var(--color-secondary-light)',
            borderColor: 'var(--color-secondary)'
          }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--color-secondary)' }} />
              <div>
                <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  Document Successfully Generated!
                </h4>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Ready for client distribution: <span className="font-semibold">{generationResult.title}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {generationResult.docx_download_url && (
                <a
                  href={generationResult.docx_download_url}
                  download
                  className="btn-tactile text-xs font-semibold px-3.5 py-2 rounded-xl border flex items-center space-x-1.5 shadow-xs"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .DOCX</span>
                </a>
              )}

              {generationResult.pdf_download_url && (
                <div className="flex items-center space-x-1.5">
                  <a
                    href={generationResult.pdf_view_url || generationResult.pdf_download_url.replace('/download/', '/view-pdf/')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-tactile text-xs font-semibold px-3 py-2 rounded-xl flex items-center space-x-1.5 border shadow-xs"
                    style={{
                      borderColor: 'var(--color-secondary)',
                      backgroundColor: 'transparent',
                      color: 'var(--color-secondary)'
                    }}
                    title="View PDF directly in browser"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View PDF</span>
                  </a>

                  <a
                    href={generationResult.pdf_download_url}
                    download
                    className="btn-tactile text-xs font-semibold px-3 py-2 rounded-xl flex items-center space-x-1.5 shadow-sm"
                    style={{
                      backgroundColor: 'var(--color-secondary)',
                      color: '#FFFFFF'
                    }}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .PDF</span>
                  </a>
                </div>
              )}

              <button
                type="button"
                onClick={onOpenFolder}
                className="btn-tactile text-xs font-medium px-3 py-2 rounded-xl border flex items-center space-x-1.5"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-secondary)'
                }}
                title="Open in Windows Explorer"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Open Folder</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}