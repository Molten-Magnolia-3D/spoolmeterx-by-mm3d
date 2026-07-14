import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { syncBarcodeMapping } from "@/lib/syncBarcodeMapping";
import { useNavigate, Link } from "react-router-dom";
import useSafeBack from "@/hooks/useSafeBack";
import BarcodeScanner from "@/components/BarcodeScanner";
import SpoolForm from "@/components/SpoolForm";
import { ArrowLeft, CheckCircle, Camera, ScanBarcode, Plus, Minus, Trash2, PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ScanPage() {
  const navigate = useNavigate();
  const goBack = useSafeBack("/");
  const [step, setStep] = useState("choose"); // choose | scanning | scanner | queue | found | manual
  const [scannedCode, setScannedCode] = useState(null);
  const [foundMapping, setFoundMapping] = useState(null);
  const [loading, setLoading] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [scanQueue, setScanQueue] = useState([]); // [{ code, mapping, quantity }]
  const [originStep, setOriginStep] = useState("scanning"); // to know where to go back after found/manual
  const scannerInputRef = useRef(null);

  // Reset to choose screen whenever the scan tab is re-entered
  useEffect(() => {
    const onReset = () => {
      setStep("choose");
      setScanQueue([]);
      setScannedCode(null);
      setFoundMapping(null);
    };
    window.addEventListener("scan-tab-reset", onReset);
    return () => window.removeEventListener("scan-tab-reset", onReset);
  }, []);

  const handleScan = async (code) => {
    // Don't re-add same code if already in queue
    if (scanQueue.some(i => i.code === code)) {
      setScanQueue(q => q.map(i => i.code === code ? { ...i, quantity: i.quantity + 1 } : i));
      return;
    }
    setScannedCode(code);
    setLoading(true);
    try {
      const results = await base44.entities.BarcodeMapping.filter({ barcode_value: code });
      if (results.length > 0) {
        // Known barcode — add straight to queue, no confirmation needed
        setScanQueue(q => [...q, { code, mapping: results[0], quantity: 1 }]);
      } else {
        setFoundMapping(null);
        setStep("manual");
      }
    } catch {
      setFoundMapping(null);
      setStep("manual");
    } finally {
      setLoading(false);
    }
  };

  const handleManualLookup = async () => {
    if (!manualCode.trim()) return;
    const code = manualCode.trim();
    setManualCode("");
    await handleScan(code);
  };

  const addToQueue = (code, mapping, quantity = 1) => {
    setScanQueue(q => [...q, { code, mapping, quantity }]);
  };

  const updateQty = (code, delta) => {
    setScanQueue(q =>
      q.map(i => i.code === code ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)
    );
  };

  const removeFromQueue = (code) => {
    setScanQueue(q => q.filter(i => i.code !== code));
  };

  const handleAddFromFound = () => {
    addToQueue(scannedCode, foundMapping);
    setStep(originStep);
    setScannedCode(null);
    setFoundMapping(null);
  };

  const handleSaveNewSpool = async (formData) => {
    setLoading(true);
    try {
      if (scannedCode) {
        await syncBarcodeMapping({ ...formData, barcode: scannedCode });
      }
      addToQueue(scannedCode, formData, formData.quantity || 1);
      setStep(originStep);
      setScannedCode(null);
      setFoundMapping(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCommitQueue = async () => {
    const spools = [];
    for (const item of scanQueue) {
      const m = item.mapping;
      for (let i = 0; i < item.quantity; i++) {
        spools.push({
          brand: m.brand,
          material: m.material,
          color_name: m.color_name,
          color_hex: m.color_hex,
          starting_weight_grams: m.starting_weight_grams || m.weight_grams || 1000,
          current_weight_grams: m.current_weight_grams || m.weight_grams || 1000,
          barcode: item.code,
          notes: m.notes,
          date_opened: new Date().toISOString().split("T")[0],
        });
      }
    }
    setLoading(true);
    try {
      await base44.entities.Spool.bulkCreate(spools);
      setScanQueue([]);
      // Signal the always-mounted Dashboard to reload before navigating back
      window.dispatchEvent(new Event("spools-updated"));
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const totalSpools = scanQueue.reduce((s, i) => s + i.quantity, 0);

  // ── CHOOSE ──────────────────────────────────────────────────────────────────
  if (step === "choose") {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto">
          <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
            <button onClick={goBack} className="p-2 -ml-2 rounded-full active:bg-muted">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-foreground">Scan Spool</span>
          </div>
          <div className="p-6 space-y-4 pt-10">
            <p className="text-center text-muted-foreground text-sm mb-6">How would you like to scan?</p>
            <button
              onClick={() => { setOriginStep("scanning"); setStep("scanning"); }}
              className="w-full flex items-center gap-4 bg-card border border-border rounded-xl p-5 active:opacity-80 text-left"
            >
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Camera className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Camera Scan</p>
                <p className="text-sm text-muted-foreground">Use your phone's camera to scan a barcode</p>
              </div>
            </button>
            <button
              onClick={() => { setOriginStep("scanner"); setStep("scanner"); }}
              className="w-full flex items-center gap-4 bg-card border border-border rounded-xl p-5 active:opacity-80 text-left"
            >
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <ScanBarcode className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Barcode Scanner</p>
                <p className="text-sm text-muted-foreground">Use a USB or Bluetooth barcode scanner gun</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── CAMERA SCANNING ──────────────────────────────────────────────────────────
  if (step === "scanning") {
    return (
      <div className="min-h-screen bg-background">
        <BarcodeScanner onScan={handleScan} onClose={() => navigate("/")} />
        {!loading && (
          <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-4 space-y-3">
            <div className="max-w-2xl mx-auto space-y-3">
              <div className="flex gap-2">
                <Input
                  value={manualCode}
                  onChange={e => setManualCode(e.target.value)}
                  placeholder="Or type barcode manually"
                  className="h-12 bg-muted border-border text-foreground font-mono"
                />
                <Button onClick={handleManualLookup} className="h-12 px-4 bg-primary text-primary-foreground">Go</Button>
              </div>
              {scanQueue.length > 0 && (
                <Button onClick={() => setStep("queue")} className="w-full h-12 bg-green-600 hover:bg-green-500 text-white font-semibold">
                  <PackagePlus className="w-4 h-4 mr-2" />
                  Review & Add {totalSpools} Spool{totalSpools !== 1 ? "s" : ""}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── SCANNER GUN ──────────────────────────────────────────────────────────────
  if (step === "scanner") {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto">
          <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
            <button onClick={() => setStep("choose")} className="p-2 -ml-2 rounded-full active:bg-muted">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-foreground">Barcode Scanner</span>
            {scanQueue.length > 0 && (
              <span className="ml-auto text-sm text-green-400 font-semibold">{totalSpools} queued</span>
            )}
          </div>
          <div className="p-6 flex flex-col items-center gap-6 pt-10">
            <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <ScanBarcode className="w-10 h-10 text-yellow-400" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground mb-1">Ready to scan</p>
              <p className="text-sm text-muted-foreground">Scan multiple barcodes — each will be added to the queue</p>
            </div>
            <div className="w-full flex gap-2">
              <Input
                ref={scannerInputRef}
                autoFocus
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleManualLookup(); }}
                placeholder="Waiting for scan…"
                className="h-14 bg-muted border-border text-foreground font-mono text-lg text-center"
              />
              <Button onClick={handleManualLookup} className="h-14 px-5 bg-primary text-primary-foreground">Go</Button>
            </div>
            {loading && <p className="text-sm text-muted-foreground">Looking up barcode…</p>}
            {scanQueue.length > 0 && (
              <Button onClick={() => setStep("queue")} className="w-full h-12 bg-green-600 hover:bg-green-500 text-white font-semibold">
                <PackagePlus className="w-4 h-4 mr-2" />
                Review & Add {totalSpools} Spool{totalSpools !== 1 ? "s" : ""}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── QUEUE REVIEW ─────────────────────────────────────────────────────────────
  if (step === "queue") {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto">
          <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
            <button onClick={() => setStep(originStep)} className="p-2 -ml-2 rounded-full active:bg-muted">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-foreground">Review Spools</span>
          </div>

          <div className="p-4 space-y-3 pb-44">
            {scanQueue.map(item => (
              <div key={item.code} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg border border-white/10 flex-shrink-0"
                  style={{ backgroundColor: item.mapping?.color_hex || "#888" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{item.mapping?.brand || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{item.mapping?.material} • {item.mapping?.color_name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{item.code}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => updateQty(item.code, -1)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center active:opacity-70">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center font-bold text-foreground">{item.quantity}</span>
                  <button onClick={() => updateQty(item.code, 1)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center active:opacity-70">
                    <Plus className="w-3 h-3" />
                  </button>
                  <button onClick={() => removeFromQueue(item.code)} className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center active:opacity-70 ml-1">
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-4" style={{ paddingBottom: "calc(1rem + 60px)" }}>
          <div className="max-w-2xl mx-auto">
            <Button
              onClick={handleCommitQueue}
              disabled={loading || scanQueue.length === 0}
              className="w-full h-14 text-base font-semibold bg-primary text-primary-foreground"
            >
              {loading ? "Adding…" : `Add ${totalSpools} Spool${totalSpools !== 1 ? "s" : ""} to Inventory`}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── FOUND ────────────────────────────────────────────────────────────────────
  if (step === "found") {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto">
          <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
            <button onClick={() => setStep(originStep)} className="p-2 -ml-2 rounded-full active:bg-muted">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-foreground">Barcode Found!</span>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-center mb-6">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
            <p className="text-center text-sm text-muted-foreground mb-6">This barcode is in your database</p>
            <div className="bg-card border border-border rounded-xl p-5 space-y-3 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl border border-white/10" style={{ backgroundColor: foundMapping.color_hex || "#888" }} />
                <div>
                  <p className="text-lg font-bold text-foreground">{foundMapping.brand}</p>
                  <p className="text-muted-foreground">{foundMapping.material} • {foundMapping.color_name}</p>
                </div>
              </div>
              {foundMapping.weight_grams && (
                <p className="text-sm text-muted-foreground">Starting weight: {foundMapping.weight_grams}g</p>
              )}
            </div>
            <Button onClick={handleAddFromFound} disabled={loading} className="w-full h-14 text-base font-semibold bg-primary text-primary-foreground">
              Add to Queue
            </Button>
            <Button variant="ghost" onClick={() => setStep("manual")} className="w-full mt-2 h-12 text-muted-foreground">
              Edit details first
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── MANUAL / NEW SPOOL ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto">
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => setStep(originStep)} className="p-2 -ml-2 rounded-full active:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="font-semibold text-foreground">New Spool</span>
            {scannedCode && <p className="text-xs text-muted-foreground font-mono">{scannedCode}</p>}
          </div>
        </div>
        <div className="p-4 pb-32">
          {scannedCode && (
            <div className="bg-blue-950/40 border border-blue-800/50 rounded-lg px-4 py-2 mb-4">
              <p className="text-xs text-blue-300">New barcode — filling details will save it for future scans</p>
            </div>
          )}
          <SpoolForm
            initialData={scannedCode ? { barcode: scannedCode, ...foundMapping } : {}}
            onSubmit={handleSaveNewSpool}
            onCancel={() => setStep(originStep)}
            loading={loading}
            showQuantity={true}
          />
        </div>
      </div>
    </div>
  );
}