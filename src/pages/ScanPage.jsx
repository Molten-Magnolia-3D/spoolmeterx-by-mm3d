import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import BarcodeScanner from "@/components/BarcodeScanner";
import SpoolForm from "@/components/SpoolForm";
import { ArrowLeft, CheckCircle, Camera, ScanBarcode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ScanPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState("choose"); // choose | scanning | scanner | found | manual
  const scannerInputRef = useRef(null);
  const [scannedCode, setScannedCode] = useState(null);
  const [foundMapping, setFoundMapping] = useState(null);
  const [loading, setLoading] = useState(false);
  const [manualCode, setManualCode] = useState("");

  const handleScan = async (code) => {
    setScannedCode(code);
    setLoading(true);
    try {
      const results = await base44.entities.BarcodeMapping.filter({ barcode_value: code });
      if (results.length > 0) {
        setFoundMapping(results[0]);
        setStep("found");
      } else {
        setFoundMapping(null);
        setStep("manual");
      }
    } catch {
      setStep("manual");
    } finally {
      setLoading(false);
    }
  };

  const handleManualLookup = async () => {
    if (!manualCode.trim()) return;
    await handleScan(manualCode.trim());
  };

  const handleSaveNewSpool = async (formData) => {
    setLoading(true);
    try {
      // Save barcode mapping if we have a code and it was unknown
      if (scannedCode && !foundMapping) {
        await base44.entities.BarcodeMapping.create({
          barcode_value: scannedCode,
          brand: formData.brand,
          material: formData.material,
          color_name: formData.color_name,
          color_hex: formData.color_hex,
          weight_grams: formData.starting_weight_grams,
          notes: formData.notes,
        });
      }
      await base44.entities.Spool.create({ ...formData, barcode: scannedCode });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleAddFromFound = async () => {
    setLoading(true);
    try {
      await base44.entities.Spool.create({
        brand: foundMapping.brand,
        material: foundMapping.material,
        color_name: foundMapping.color_name,
        color_hex: foundMapping.color_hex,
        starting_weight_grams: foundMapping.weight_grams || 1000,
        current_weight_grams: foundMapping.weight_grams || 1000,
        barcode: scannedCode,
        notes: foundMapping.notes,
        date_opened: new Date().toISOString().split("T")[0],
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  if (step === "choose") {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/")} className="p-2 -ml-2 rounded-full active:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold text-foreground">Scan Spool</span>
        </div>
        <div className="p-6 space-y-4 pt-10">
          <p className="text-center text-muted-foreground text-sm mb-6">How would you like to scan?</p>

          <button
            onClick={() => setStep("scanning")}
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
            onClick={() => setStep("scanner")}
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
    );
  }

  if (step === "scanner") {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => setStep("choose")} className="p-2 -ml-2 rounded-full active:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold text-foreground">Barcode Scanner</span>
        </div>
        <div className="p-6 flex flex-col items-center gap-6 pt-10">
          <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <ScanBarcode className="w-10 h-10 text-yellow-400" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground mb-1">Ready to scan</p>
            <p className="text-sm text-muted-foreground">Click the field below, then scan a barcode with your scanner gun</p>
          </div>
          <div className="w-full flex gap-2">
            <Input
              ref={scannerInputRef}
              autoFocus
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { handleManualLookup(); setManualCode(""); } }}
              placeholder="Waiting for scan…"
              className="h-14 bg-muted border-border text-foreground font-mono text-lg text-center"
            />
            <Button onClick={() => { handleManualLookup(); setManualCode(""); }} className="h-14 px-5 bg-primary text-primary-foreground">
              Go
            </Button>
          </div>
          {loading && <p className="text-sm text-muted-foreground">Looking up barcode…</p>}
        </div>
      </div>
    );
  }

  if (step === "scanning") {
    return (
      <div className="min-h-screen bg-background">
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => navigate("/")}
        />
        {/* Manual entry fallback at bottom */}
        {!loading && (
          <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-4">
            <p className="text-xs text-muted-foreground mb-2 text-center">Or enter barcode manually</p>
            <div className="flex gap-2">
              <Input
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                placeholder="Type barcode value"
                className="h-12 bg-muted border-border text-foreground font-mono"
              />
              <Button onClick={handleManualLookup} className="h-12 px-4 bg-primary text-primary-foreground">
                Go
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (step === "found") {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => setStep("scanning")} className="p-2 -ml-2 rounded-full active:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold text-foreground">Barcode Found!</span>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-center mb-6">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
          <p className="text-center text-sm text-muted-foreground mb-6">
            This barcode is in your database
          </p>

          <div className="bg-card border border-border rounded-xl p-5 space-y-3 mb-6">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-xl border border-white/10"
                style={{ backgroundColor: foundMapping.color_hex || "#888" }}
              />
              <div>
                <p className="text-lg font-bold text-foreground">{foundMapping.brand}</p>
                <p className="text-muted-foreground">{foundMapping.material} • {foundMapping.color_name}</p>
              </div>
            </div>
            {foundMapping.weight_grams && (
              <p className="text-sm text-muted-foreground">Starting weight: {foundMapping.weight_grams}g</p>
            )}
          </div>

          <Button
            onClick={handleAddFromFound}
            disabled={loading}
            className="w-full h-14 text-base font-semibold bg-primary text-primary-foreground"
          >
            {loading ? "Adding…" : "Add to Inventory"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setStep("manual")}
            className="w-full mt-2 h-12 text-muted-foreground"
          >
            Edit details first
          </Button>
        </div>
      </div>
    );
  }

  // step === "manual"
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => setStep("scanning")} className="p-2 -ml-2 rounded-full active:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <span className="font-semibold text-foreground">New Spool</span>
          {scannedCode && <p className="text-xs text-muted-foreground font-mono">{scannedCode}</p>}
        </div>
      </div>
      <div className="p-4 pb-8">
        {scannedCode && (
          <div className="bg-blue-950/40 border border-blue-800/50 rounded-lg px-4 py-2 mb-4">
            <p className="text-xs text-blue-300">New barcode — filling details will save it for future scans</p>
          </div>
        )}
        <SpoolForm
          initialData={scannedCode ? { barcode: scannedCode, ...foundMapping } : {}}
          onSubmit={handleSaveNewSpool}
          onCancel={() => navigate("/")}
          loading={loading}
        />
      </div>
    </div>
  );
}