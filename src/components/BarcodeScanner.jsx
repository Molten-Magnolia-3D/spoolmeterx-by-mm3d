import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X } from "lucide-react";

export default function BarcodeScanner({ onScan, onClose }) {
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const containerId = "barcode-scanner-container";

  useEffect(() => {
    let scanner;

    const startScanner = async () => {
      try {
        scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            onScan(decodedText);
          },
          () => {}
        );
      } catch (err) {
        setError("Camera access denied or unavailable. Please allow camera access and try again.");
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between p-4 bg-background/80 backdrop-blur">
        <span className="text-base font-semibold text-foreground">Scan Barcode</span>
        <button onClick={onClose} className="p-2 rounded-full bg-muted active:bg-accent">
          <X className="w-5 h-5" />
        </button>
      </div>

      {error ? (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <p className="text-red-400 text-sm">{error}</p>
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