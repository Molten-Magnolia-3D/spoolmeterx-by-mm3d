import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X } from "lucide-react";


export default function BarcodeScanner({ onScan, onClose }) {
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const lastScanRef = useRef({ code: null, time: 0 });
  const containerId = "barcode-scanner-container";

  useEffect(() => {
    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            const now = Date.now();
            const last = lastScanRef.current;
            // Ignore repeat reads of the same code within 2 seconds
            if (last.code === decodedText && now - last.time < 2000) {
              return;
            }
            lastScanRef.current = { code: decodedText, time: now };
            onScan(decodedText);
          },
          () => {}
        );
  
      } catch (err) {
        scannerRef.current = null;
        setError("Camera access denied or unavailable. Please allow camera access and try again.");
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {});
        } catch {}
        scannerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col"
      style={{ paddingTop: "max(0px, env(safe-area-inset-top))", paddingBottom: "max(0px, env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center justify-between px-4 py-4 bg-background/80 backdrop-blur"
        style={{ paddingTop: "max(16px, env(safe-area-inset-top))" }}
      >
        <span className="text-base font-semibold text-foreground">Scan Barcode</span>
        <button onClick={onClose} className="p-2 rounded-full bg-muted active:bg-accent">
          <X className="w-5 h-5" />
        </button>
      </div>

      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-muted text-foreground text-sm font-semibold active:opacity-80"
          >
            Go Back
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div id={containerId} className="w-full max-w-sm" />
          <p className="text-muted-foreground text-sm mt-4 px-6 text-center">
            Point your camera at a barcode or QR code on the spool
          </p>
        </div>
      )}
    </div>
  );
}