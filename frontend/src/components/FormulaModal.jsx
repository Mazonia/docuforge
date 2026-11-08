import React, { useState } from "react";
import { Calculator, X, Check, ArrowRight, Sparkles, RefreshCw, AlertCircle } from "lucide-react";

export default function FormulaModal({
  isOpen,
  onClose,
  placeholders,
  currentReplacements,
  onApplyCalculation,
  hasCalculatedOnce,
}) {
  if (!isOpen) return null;

  // Filter numeric or formula-relevant fields
  const numFields = (placeholders || []).filter((p) => {
    const k = p.key.toLowerCase();
    const type = p.type;
    return (
      type === "number" ||
      k.includes("amount") ||
      k.includes("fee") ||
      k.includes("rate") ||
      k.includes("total") ||
      k.includes("price") ||
      k.includes("cost") ||
      k.includes("bounty") ||
      k.includes("hours") ||
      k.includes("payout") ||
      k.trim() === "x"
    );
  });

  // Pick reasonable defaults for source fields if present
  const defaultBaseField = numFields.find((f) => {
    const k = f.key.toLowerCase();
    return k.includes("amount") || k.includes("cost") || k.includes("price") || k.includes("bounty");
  }) || numFields[0];

  const defaultModifierField = numFields.find((f) => {
    const k = f.key.toLowerCase();
    return k.includes("rate") || k.includes("fee") || k.includes("%") || f.key.trim().toLowerCase() === "x";
  });

  const defaultTargetField = numFields.find((f) => {
    const k = f.key.toLowerCase();
    return k.includes("total") || (k.includes("payout") && !k.includes("timing"));
  }) || defaultBaseField;

  const [calcType, setCalcType] = useState("percentage_fee"); // "percentage_fee" | "hours_rate" | "custom_formula"
  const [baseFieldRaw, setBaseFieldRaw] = useState(defaultBaseField?.raw || "");
  const [modifierFieldRaw, setModifierFieldRaw] = useState(defaultModifierField?.raw || "");
  const [targetFieldRaw, setTargetFieldRaw] = useState(defaultTargetField?.raw || "");
  const [operation, setOperation] = useState("add_percentage"); // "add_percentage", "subtract_percentage", "multiply"
  const [previewResult, setPreviewResult] = useState("");
  const [warnRepeat, setWarnRepeat] = useState(hasCalculatedOnce);

  // Compute preview
  const parseNum = (val) => {
    if (!val) return 0;
    const clean = String(val).replace(/[^0-9.-]/g, "");
    return parseFloat(clean) || 0;
  };

  const baseVal = parseNum(currentReplacements[baseFieldRaw] || defaultBaseField?.suggested || "45000");
  const modVal = parseNum(currentReplacements[modifierFieldRaw] || defaultModifierField?.suggested || "6");

  let computedVal = 0;
  let formulaDesc = "";

  if (calcType === "percentage_fee") {
    if (operation === "add_percentage") {
      const fee = baseVal * (modVal / 100);
      computedVal = baseVal + fee;
      formulaDesc = `${baseVal.toLocaleString()} + ${modVal}% (${fee.toLocaleString()}) = ${computedVal.toLocaleString()}`;
    } else {
      const fee = baseVal * (modVal / 100);
      computedVal = baseVal - fee;
      formulaDesc = `${baseVal.toLocaleString()} - ${modVal}% (${fee.toLocaleString()}) = ${computedVal.toLocaleString()}`;
    }
  } else if (calcType === "hours_rate") {
    computedVal = baseVal * modVal;
    formulaDesc = `${baseVal.toLocaleString()} hrs × ${modVal.toLocaleString()} rate = ${computedVal.toLocaleString()}`;
  }

  const handleApply = () => {
    if (!targetFieldRaw) {
      alert("Please select a target field to store the calculation result.");
      return;
    }

    const formattedResult = computedVal.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    onApplyCalculation({
      targetRaw: targetFieldRaw,
      value: formattedResult,
      baseRaw: baseFieldRaw,
      modifierRaw: modifierFieldRaw,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#00CED1]/15 text-[#00CED1] flex items-center justify-center">
              <Calculator size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Formula & Field Calculator</h3>
              <p className="text-xs text-slate-400">Calculate math selectively for specific template fields</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Warning if recalculating */}
        {warnRepeat && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-amber-300 text-xs">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Calculations already applied once:</span>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                Are you sure you want to recalculate? Running math again on already adjusted numbers may compound previous results.
              </p>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Calculation Presets */}
          <div>
            <label className="text-slate-300 font-semibold mb-1.5 block">Calculation Model</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCalcType("percentage_fee")}
                className={`p-2.5 rounded-xl border text-left font-medium transition-all cursor-pointer ${
                  calcType === "percentage_fee"
                    ? "bg-[#00CED1]/15 border-[#00CED1] text-[#00CED1]"
                    : "bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-300"
                }`}
              >
                <div className="font-bold">Percentage / Fee</div>
                <div className="text-[11px] opacity-75">Subtotal ± Percentage (e.g. Surcharge / Fee %)</div>
              </button>
              <button
                type="button"
                onClick={() => setCalcType("hours_rate")}
                className={`p-2.5 rounded-xl border text-left font-medium transition-all cursor-pointer ${
                  calcType === "hours_rate"
                    ? "bg-[#00CED1]/15 border-[#00CED1] text-[#00CED1]"
                    : "bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-300"
                }`}
              >
                <div className="font-bold">Multiplication Product</div>
                <div className="text-[11px] opacity-75">Hours × Hourly Rate or Quantity × Price</div>
              </button>
            </div>
          </div>

          {/* Source Fields Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 mb-1 block">
                {calcType === "hours_rate" ? "Hours / Quantity Field" : "Base Amount Field"}
              </label>
              <select
                value={baseFieldRaw}
                onChange={(e) => setBaseFieldRaw(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-[#00CED1]"
              >
                {placeholders.map((p) => (
                  <option key={p.raw} value={p.raw}>
                    {p.label || p.key} ({currentReplacements[p.raw] || p.suggested || "0"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 mb-1 block">
                {calcType === "hours_rate" ? "Rate / Unit Price Field" : "Fee / Percentage Field"}
              </label>
              <select
                value={modifierFieldRaw}
                onChange={(e) => setModifierFieldRaw(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-[#00CED1]"
              >
                {placeholders.map((p) => (
                  <option key={p.raw} value={p.raw}>
                    {p.label || p.key} ({currentReplacements[p.raw] || p.suggested || "0"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Operation selection for percentage */}
          {calcType === "percentage_fee" && (
            <div>
              <label className="text-slate-400 mb-1 block">Operation</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOperation("add_percentage")}
                  className={`flex-1 py-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                    operation === "add_percentage"
                      ? "bg-emerald-500/15 border-emerald-500 text-emerald-400 font-bold"
                      : "bg-slate-950/40 border-slate-800 text-slate-400"
                  }`}
                >
                  Add Surcharge (+)
                </button>
                <button
                  type="button"
                  onClick={() => setOperation("subtract_percentage")}
                  className={`flex-1 py-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                    operation === "subtract_percentage"
                      ? "bg-rose-500/15 border-rose-500 text-rose-400 font-bold"
                      : "bg-slate-950/40 border-slate-800 text-slate-400"
                  }`}
                >
                  Deduct Fee / Logistics (-)
                </button>
              </div>
            </div>
          )}

          {/* Target field to store result */}
          <div>
            <label className="text-slate-300 font-semibold mb-1 block">Target Field to Update</label>
            <select
              value={targetFieldRaw}
              onChange={(e) => setTargetFieldRaw(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-[#00CED1]"
            >
              {placeholders.map((p) => (
                <option key={p.raw} value={p.raw}>
                  Target: {p.label || p.key} (Current: {currentReplacements[p.raw] || "empty"})
                </option>
              ))}
            </select>
          </div>

          {/* Computed Preview */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400">Formula Result Preview:</div>
              <div className="font-mono text-sm font-bold text-[#00CED1] mt-0.5">
                {computedVal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{formulaDesc}</div>
            </div>
            <Sparkles size={20} className="text-[#00CED1]" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-[#00CED1] text-slate-950 hover:bg-[#00CED1]/90 flex items-center gap-1.5 shadow-lg shadow-[#00CED1]/20 transition-all cursor-pointer"
          >
            <Check size={14} /> Apply Calculation
          </button>
        </div>
      </div>
    </div>
  );
}

