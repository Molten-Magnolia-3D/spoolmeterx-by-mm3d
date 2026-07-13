import { useEffect, useRef } from "react";

// Replace these with your real values after Google AdSense approves your account:
// 1. Set ADSENSE_CLIENT to your Publisher ID (e.g. "ca-pub-1234567890123456")
// 2. Set ADSENSE_SLOT to your Ad Unit slot ID (e.g. "1234567890")
const ADSENSE_CLIENT = "ca-pub-5193605333784435";
const ADSENSE_SLOT = "XXXXXXXXXX"; // <-- replace this
const IS_CONFIGURED = !ADSENSE_CLIENT.includes("XXXXXXXXX");

export default function AdBanner({ className = "" }) {
  const adRef = useRef(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (!IS_CONFIGURED || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (e) {
      // silently ignore
    }
  }, []);

  if (!IS_CONFIGURED) {
    // Placeholder shown until AdSense is configured
    return (
      <div className={`w-full rounded-xl border border-dashed border-border bg-muted/30 flex items-center justify-center text-xs text-muted-foreground py-4 ${className}`}>
        Ad placeholder — configure AdSense in AdBanner.jsx
      </div>
    );
  }

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={ADSENSE_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}