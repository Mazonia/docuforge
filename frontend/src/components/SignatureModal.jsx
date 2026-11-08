import React, { useRef, useState, useEffect } from "react";
import { PenTool, Upload, RotateCcw, Check, X, ShieldCheck } from "lucide-react";
import { useToast } from "./ToastProvider";

export default function SignatureModal({ isOpen, onClose, onSave, currentSignature }) {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState("draw"); // "draw" or "upload"
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [uploadedPreview, setUploadedPreview] = useState(null);

  useEffect(() => {
    if (isOpen && activeTab === "draw") {
      setTimeout(initCanvas, 50);
    }
  }, [isOpen, activeTab]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2.5;

    // If there is an existing currentSignature and it's a data url, draw it
    if (currentSignature && currentSignature.startsWith("data:image")) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasSignature(true);
      };
      img.src = currentSignature;
    }
  };

  const getCanvasPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getCanvasPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getCanvasPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (isDrawing) {
      e.preventDefault();
      setIsDrawing(false);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addToast("Signature image must be under 5MB.", "warning");
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        setUploadedPreview(evt.target.result);
        setHasSignature(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (activeTab === "draw") {
      const canvas = canvasRef.current;
      if (canvas && hasSignature) {
        const dataUrl = canvas.toDataURL("image/png");
        onSave(dataUrl);
      } else {
        onSave(null);
      }
    } else {
      if (uploadedPreview) {
        onSave(uploadedPreview);
      } else {
        onSave(null);
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#00CED1]/15 text-[#00CED1] flex items-center justify-center">
              <PenTool size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Digital Signature & Stamp</h3>
              <p className="text-xs text-slate-400">Embeds into [Signature] or [Company Stamp] anchors</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => setActiveTab("draw")}
            className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 transition-colors border-b-2 ${
              activeTab === "draw"
                ? "border-[#00CED1] text-[#00CED1] bg-[#00CED1]/5"
                : "border-transparent text-slate-400 hover:text-slate-300"
            }`}
          >
            <PenTool size={14} /> Draw Signature
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 transition-colors border-b-2 ${
              activeTab === "upload"
                ? "border-[#00CED1] text-[#00CED1] bg-[#00CED1]/5"
                : "border-transparent text-slate-400 hover:text-slate-300"
            }`}
          >
            <Upload size={14} /> Upload PNG / Stamp
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center">
          {activeTab === "draw" ? (
            <div className="w-full">
              <div className="relative border-2 border-dashed border-slate-700 rounded-xl overflow-hidden bg-white shadow-inner">
                <canvas
                  ref={canvasRef}
                  width={460}
                  height={180}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-44 cursor-crosshair touch-none"
                />
                {!hasSignature && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300 text-sm italic">
                    Draw your signature here with mouse or stylus
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center mt-3">
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw size={12} /> Clear Canvas
                </button>
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <ShieldCheck size={12} className="text-[#00CED1]" /> High-resolution vector preservation
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              {uploadedPreview ? (
                <div className="w-full relative border border-slate-700 rounded-xl p-4 bg-slate-950 flex flex-col items-center">
                  <img
                    src={uploadedPreview}
                    alt="Uploaded signature"
                    className="max-h-36 max-w-full object-contain filter invert dark:invert-0"
                  />
                  <button
                    type="button"
                    onClick={() => setUploadedPreview(null)}
                    className="mt-3 text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                  >
                    <RotateCcw size={12} /> Choose Another
                  </button>
                </div>
              ) : (
                <label className="w-full border-2 border-dashed border-slate-700 hover:border-[#00CED1] rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-950/40">
                  <Upload size={32} className="text-slate-500 mb-2" />
                  <span className="text-sm font-semibold text-slate-300">Click or drag signature / stamp PNG</span>
                  <span className="text-xs text-slate-500 mt-1">Transparent background recommended (max 5MB)</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-t border-slate-800">
          <button
            type="button"
            onClick={() => {
              onSave(null);
              onClose();
            }}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            Remove Signature
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#00CED1] text-slate-950 hover:bg-[#00CED1]/90 flex items-center gap-1.5 shadow-lg shadow-[#00CED1]/20 transition-all"
            >
              <Check size={14} /> Apply Signature
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

