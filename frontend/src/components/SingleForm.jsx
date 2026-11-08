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
  Plus
} from 'lucide-react';

export default function SingleForm({ 
  template, 
  replacements, 
  setReplacements, 
  onGenerate, 
  isGenerating, 
  generationResult,
  onOpenFolder,
  onOpenAddPlaceholderModal
}) {
  const [docTitle, setDocTitle] = useState('AsedaHost Proposal - Kofi Shots');
  const [format, setFormat] = useState('both');
  const [showSnippets, setShowSnippets] = useState({});
  const [conditionalModes, setConditionalModes] = useState({});

  const placeholders = template?.placeholders || [];

  // When amount or X changes, auto-update conditional clauses if linked
  useEffect(() => {
    placeholders.forEach(field => {
      if (field.is_conditional && conditionalModes[field.raw] === 'option_1') {
        // Linked to option with amount
        const amountVal = replacements['[amount]'] || '150.00';
        const formatted = `carries a setup fee of GHS ${amountVal}`;
        if (replacements[field.raw] !== formatted) {
          setReplacements(prev => ({ ...prev, [field.raw]: formatted }));
        }
      }
    });
  }, [replacements['[amount]'], conditionalModes]);

  // Built-in presets
  const presets = [
    {
      name: 'Studio 45 Photography',
      title: 'Proposal - Studio 45 Visuals',
      data: {
        '[Business Name]': 'Studio 45 Visuals',
        '[Title and Last Name]': 'Mr. Kwame Darko',
        '[service type, e.g. photography]': 'photography & live streaming',
        '[service type]': 'photography',
        '[amount]': '150.00',
        '[X]': '7',
        '[payout timing]': '24 hours',
        '[is free / carries a setup fee of GHS [amount]]': 'carries a setup fee of GHS 150.00',
        '[deducts a service fee of [X]% from each paid booking]': 'deducts a service fee of 7% from each paid booking',
        '[by mobile money or bank transfer, within [payout timing] of the service date]': 'by mobile money or bank transfer, within 24 hours of the service date'
      }
    },
    {
      name: 'SoundWave Rentals (DJ & Sound)',
      title: 'Proposal - SoundWave Rentals',
      data: {
        '[Business Name]': 'SoundWave Sound & Stage Rentals',
        '[Title and Last Name]': 'Ms. Abena Osei',
        '[service type, e.g. photography]': 'sound equipment, PA systems & DJ',
        '[service type]': 'sound rental',
        '[amount]': '250.00',
        '[X]': '8',
        '[payout timing]': '12 hours',
        '[is free / carries a setup fee of GHS [amount]]': 'carries a setup fee of GHS 250.00',
        '[deducts a service fee of [X]% from each paid booking]': 'deducts a service fee of 8% from each paid booking',
        '[by mobile money or bank transfer, within [payout timing] of the service date]': 'by mobile money or bank transfer, within 12 hours of the service date'
      }
    },
    {
      name: 'Royal Palm Gourmet Catering',
      title: 'Proposal - Royal Palm Catering',
      data: {
        '[Business Name]': 'Royal Palm Gourmet Catering',
        '[Title and Last Name]': 'Chef Emmanuel Adjei',
        '[service type, e.g. photography]': 'event catering and corporate banquets',
        '[service type]': 'catering',
        '[amount]': '0.00',
        '[X]': '5',
        '[payout timing]': '48 hours',
        '[is free / carries a setup fee of GHS [amount]]': 'is free for accredited food vendors',
        '[deducts a service fee of [X]% from each paid booking]': 'deducts a service fee of 5% from each paid booking',
        '[by mobile money or bank transfer, within [payout timing] of the service date]': 'by mobile money or bank transfer, within 48 hours of the service date'
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
      replacements
    });
  };

  return (
    <div className="space-y-6">
      
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
                className="btn-tactile text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all"
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
            className="text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors"
            style={{ color: 'var(--color-primary)' }}
          >
            Auto-Fill Suggestions
          </button>
          <span style={{ color: 'var(--border-color)' }}>|</span>
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors hover:text-red-500"
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
              placeholder="e.g. AsedaHost Proposal - Kofi Shots"
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
                Customize client variables and conditional statements below.
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
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
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
                            val.startsWith('is free') 
                              ? 'is_free' 
                              : val.startsWith('carries a setup fee') 
                                ? 'fee' 
                                : 'custom'
                          }
                          onChange={(e) => handleConditionalChoice(field.raw, e.target.value, val)}
                          className="text-xs px-3 py-2 rounded-lg border focus:outline-none transition-all font-medium"
                          style={{
                            backgroundColor: 'var(--bg-card)',
                            borderColor: 'var(--border-color)',
                            color: 'var(--text-primary)'
                          }}
                        >
                          <option value="is_free">Option 1: Listing is Free (No Setup Fee)</option>
                          <option value="fee">Option 2: Carries Setup Fee (GHS {replacements['[amount]'] || '150.00'})</option>
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
                <a
                  href={generationResult.pdf_download_url}
                  download
                  className="btn-tactile text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-sm"
                  style={{
                    backgroundColor: 'var(--color-secondary)',
                    color: '#FFFFFF'
                  }}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .PDF</span>
                </a>
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
