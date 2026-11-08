import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import FileDropzone from './components/FileDropzone';
import SingleForm from './components/SingleForm';
import BatchGrid from './components/BatchGrid';
import DocumentPreview from './components/DocumentPreview';
import CsvImportModal from './components/CsvImportModal';
import AddPlaceholderModal from './components/AddPlaceholderModal';
import AboutModal from './components/AboutModal';
import WelcomeFeatures from './components/WelcomeFeatures';
import TemplateDrawer from './components/TemplateDrawer';
import SignatureModal from './components/SignatureModal';
import { 
  FileText, 
  Table, 
  Sparkles, 
  CheckCircle2, 
  FolderOpen, 
  Layers
} from 'lucide-react';

export default function App() {
  const [isDark, setIsDark] = useState(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [activeTab, setActiveTab] = useState('single'); // 'single' | 'batch'
  const [template, setTemplate] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSampleLoading, setIsSampleLoading] = useState(false);

  // Single Form State
  const [singleReplacements, setSingleReplacements] = useState({});
  const [isGeneratingSingle, setIsGeneratingSingle] = useState(false);
  const [singleResult, setSingleResult] = useState(null);

  // Batch Grid State
  const [batchRows, setBatchRows] = useState([]);
  const [activeBatchRowIndex, setActiveBatchRowIndex] = useState(0);
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [batchResult, setBatchResult] = useState(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  // Digital Signature & Stamp (Suggestion 8)
  const [signatureDataUrl, setSignatureDataUrl] = useState(null);
  const [isGlobalSigOpen, setIsGlobalSigOpen] = useState(false);

  // Smart Conditional Clauses Guard (Suggestion 4)
  const [hiddenClauses, setHiddenClauses] = useState([]);

  // Page Budget Guard (Suggestion 5)
  const [pageBudget, setPageBudget] = useState(2);

  // Reusable Presets & Template Drawer (Suggestion 7)
  const [isTemplateDrawerOpen, setIsTemplateDrawerOpen] = useState(false);

  // Add Custom Placeholder State
  const [isAddPlaceholderOpen, setIsAddPlaceholderOpen] = useState(false);
  const [initialCustomText, setInitialCustomText] = useState('');

  // About & FAQ Modal State
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Status info from backend
  const [serverStatus, setServerStatus] = useState(null);

  // Sync dark class on <html>
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Initial Load: Check backend health status (starts in a pristine blank slate)
  useEffect(() => {
    const initApp = async () => {
      try {
        const resp = await fetch('/api/status');
        const data = await resp.json();
        setServerStatus(data);
      } catch (err) {
        console.error("Backend status check failed:", err);
      }
    };
    initApp();
  }, []);

  const loadSampleTemplate = async (samplePath) => {
    setIsSampleLoading(true);
    try {
      const resp = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: samplePath })
      });
      const data = await resp.json();
      setupTemplate(data);
    } catch (err) {
      console.error("Failed to load sample:", err);
    } finally {
      setIsSampleLoading(false);
    }
  };

  const handleManualLoadSample = async () => {
    if (serverStatus?.samples?.[0]?.path) {
      await loadSampleTemplate(serverStatus.samples[0].path);
    } else {
      try {
        const resp = await fetch('/api/samples');
        const data = await resp.json();
        if (data.samples && data.samples.length > 0) {
          await loadSampleTemplate(data.samples[0].filepath || data.samples[0].path);
        }
      } catch (err) {
        console.error("Could not load sample template:", err);
      }
    }
  };

  const setupTemplate = (templateData) => {
    setTemplate(templateData);

    const initialReplacements = {
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
    };

    templateData.placeholders?.forEach(p => {
      if (!initialReplacements[p.raw]) {
        initialReplacements[p.raw] = p.suggested || '';
      }
    });
    setSingleReplacements(initialReplacements);

    const initialBatch = [
      {
        id: 'rec_1',
        label: 'Aegis Recon Squadron 9',
        replacements: { ...initialReplacements }
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
      }
    ];

    setBatchRows(initialBatch);
    setActiveBatchRowIndex(0);
    setSingleResult(null);
    setBatchResult(null);
  };

  const handleFileUpload = async (file) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const resp = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(errData.detail || "Upload failed");
      }
      const data = await resp.json();
      setupTemplate(data);
    } catch (err) {
      alert("Error processing document: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateSingle = async (payload) => {
    setIsGeneratingSingle(true);
    setSingleResult(null);
    try {
      const resp = await fetch('/api/generate/single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) throw new Error("Generation failed");
      const data = await resp.json();
      setSingleResult(data);
    } catch (err) {
      alert("Document Generation Error: " + err.message);
    } finally {
      setIsGeneratingSingle(false);
    }
  };

  const handleGenerateBatch = async (payload) => {
    setIsGeneratingBatch(true);
    setBatchResult(null);
    try {
      const resp = await fetch('/api/generate/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) throw new Error("Batch generation failed");
      const data = await resp.json();
      setBatchResult(data);
    } catch (err) {
      alert("Batch Generation Error: " + err.message);
    } finally {
      setIsGeneratingBatch(false);
    }
  };

  const handleOpenFolder = async () => {
    try {
      await fetch('/api/open-output-folder', { method: 'POST' });
    } catch (err) {
      console.error("Open folder failed:", err);
    }
  };

  const handleCsvImport = (newRows, replaceExisting) => {
    if (replaceExisting) {
      setBatchRows(newRows);
      setActiveBatchRowIndex(0);
    } else {
      setBatchRows(prev => [...prev, ...newRows]);
    }
  };

  const handleAddCustomPlaceholder = (newField) => {
    if (!template) return;
    setTemplate(prev => ({
      ...prev,
      placeholders: [...prev.placeholders, newField]
    }));

    setSingleReplacements(prev => ({
      ...prev,
      [newField.raw]: ''
    }));

    setBatchRows(prev => prev.map(row => ({
      ...row,
      replacements: {
        ...row.replacements,
        [newField.raw]: ''
      }
    })));
  };

  const handleOpenAddPlaceholderWithText = (text) => {
    setInitialCustomText(text);
    setIsAddPlaceholderOpen(true);
  };

  const activePreviewReplacements = activeTab === 'single'
    ? singleReplacements
    : (batchRows[activeBatchRowIndex]?.replacements || {});

  const activePreviewLabel = activeTab === 'single'
    ? (singleReplacements['[Business Name]'] || 'Single Client')
    : (batchRows[activeBatchRowIndex]?.label || `Client ${activeBatchRowIndex + 1}`);

  return (
    <div className="min-h-screen flex flex-col transition-colors"
      style={{ backgroundColor: 'var(--bg-main)' }}>
      
      {/* Top Header */}
      <Header
        isDark={isDark}
        setIsDark={setIsDark}
        onOpenFolder={handleOpenFolder}
        onLoadSample={handleManualLoadSample}
        isSampleLoading={isSampleLoading}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenTemplateDrawer={() => setIsTemplateDrawerOpen(true)}
        onOpenSignatureModal={() => setIsGlobalSigOpen(true)}
      />

      {/* Main Content: Naturally Responsive Container (Scales based on Window Size) */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-6">
        
        {/* Template Upload / Active Banner */}
        <FileDropzone
          template={template}
          onFileUpload={handleFileUpload}
          isUploading={isUploading}
          onReset={() => setTemplate(null)}
          onOpenAddPlaceholderModal={() => setIsAddPlaceholderOpen(true)}
        />

        {/* When no template is loaded, display engaging feature capabilities & demo launcher */}
        {!template && (
          <WelcomeFeatures
            onLoadDemo={handleManualLoadSample}
            isDemoLoading={isSampleLoading}
          />
        )}

        {template && (
          <div className="space-y-6">
            
            {/* Mode Switcher Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b"
              style={{ borderColor: 'var(--border-color)' }}>
              
              <div className="flex items-center space-x-1 p-1 rounded-xl border shadow-xs"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-color)'
                }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('single')}
                  className={`btn-tactile text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-2 transition-all cursor-pointer ${
                    activeTab === 'single' ? 'shadow-xs' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: activeTab === 'single' ? 'var(--color-primary)' : 'transparent',
                    color: activeTab === 'single' ? '#FFFFFF' : 'var(--text-primary)'
                  }}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Single Document Form</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('batch')}
                  className={`btn-tactile text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-2 transition-all cursor-pointer ${
                    activeTab === 'batch' ? 'shadow-xs' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: activeTab === 'batch' ? 'var(--color-primary)' : 'transparent',
                    color: activeTab === 'batch' ? '#FFFFFF' : 'var(--text-primary)'
                  }}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Multi-Client Tabular Grid</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-mono">
                    {batchRows.length}
                  </span>
                </button>
              </div>

              <div className="flex items-center space-x-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Word Native COM PDF</span>
                </span>
                <span>•</span>
                <span>Run-Safe Substitution</span>
              </div>

            </div>

            {/* Responsive Split Workspace: Adapts smoothly across all screen sizes */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Form or Grid */}
              <div className={activeTab === 'batch' ? 'xl:col-span-8 space-y-6' : 'xl:col-span-7 space-y-6'}>
                {activeTab === 'single' ? (
                  <SingleForm
                    template={template}
                    replacements={singleReplacements}
                    setReplacements={setSingleReplacements}
                    onGenerate={handleGenerateSingle}
                    isGenerating={isGeneratingSingle}
                    generationResult={singleResult}
                    onOpenFolder={handleOpenFolder}
                    onOpenAddPlaceholderModal={() => setIsAddPlaceholderOpen(true)}
                    signatureDataUrl={signatureDataUrl}
                    setSignatureDataUrl={setSignatureDataUrl}
                    hiddenClauses={hiddenClauses}
                    setHiddenClauses={setHiddenClauses}
                  />
                ) : (
                  <BatchGrid
                    template={template}
                    rows={batchRows}
                    setRows={setBatchRows}
                    activeRowIndex={activeBatchRowIndex}
                    setActiveRowIndex={setActiveBatchRowIndex}
                    onGenerateBatch={handleGenerateBatch}
                    isGeneratingBatch={isGeneratingBatch}
                    batchResult={batchResult}
                    onOpenFolder={handleOpenFolder}
                    onOpenCsvModal={() => setIsCsvModalOpen(true)}
                    onOpenAddPlaceholderModal={() => setIsAddPlaceholderOpen(true)}
                    globalSignature={signatureDataUrl}
                    setGlobalSignature={setSignatureDataUrl}
                  />
                )}
              </div>

              {/* Right Column: Live & Realistic Document Preview */}
              <div className={activeTab === 'batch' ? 'xl:col-span-4 sticky top-20' : 'xl:col-span-5 sticky top-20'}>
                <DocumentPreview
                  template={template}
                  replacements={activePreviewReplacements}
                  activeLabel={activePreviewLabel}
                  hiddenClauses={hiddenClauses}
                  signatureDataUrl={signatureDataUrl}
                  pageBudget={pageBudget}
                  onPageBudgetChange={setPageBudget}
                  onAddCustomFromSelection={handleOpenAddPlaceholderWithText}
                />
              </div>

            </div>

          </div>
        )}

      </main>

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onImport={handleCsvImport}
        template={template}
      />

      {/* Add Custom Placeholder Modal */}
      <AddPlaceholderModal
        isOpen={isAddPlaceholderOpen}
        onClose={() => {
          setIsAddPlaceholderOpen(false);
          setInitialCustomText('');
        }}
        onAdd={handleAddCustomPlaceholder}
        templatePath={template?.filepath}
      />

      {/* About & FAQ Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      {/* Template Workspace Drawer (Suggestion 7) */}
      <TemplateDrawer
        isOpen={isTemplateDrawerOpen}
        onClose={() => setIsTemplateDrawerOpen(false)}
        samples={serverStatus?.samples || []}
        currentTemplatePath={template?.filepath}
        onSelectTemplate={(sample) => loadSampleTemplate(sample.filepath || sample.path)}
      />

      {/* Global Signature Modal (Suggestion 8) */}
      <SignatureModal
        isOpen={isGlobalSigOpen}
        onClose={() => setIsGlobalSigOpen(false)}
        onSave={(sig) => setSignatureDataUrl(sig)}
        currentSignature={signatureDataUrl}
      />

    </div>
  );
}
