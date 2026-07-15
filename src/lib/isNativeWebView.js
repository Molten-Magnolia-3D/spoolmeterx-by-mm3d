/**
 * Returns true when the app is running inside a native Android/iOS WebView wrapper.
 * Checks common signals: custom UA strings, injected JS bridge objects, or
 * a missing `window.open` (stripped by some WebView hosts).
 */
export function isNativeWebView() {
  const ua = navigator.userAgent || "";
  // Common WebView UA markers
  if (/SpoolmeterX|wv\b|WebView/i.test(ua)) return true;
  // Android WebView typically includes "wv" in the UA and lacks Chrome's standalone flag
  if (/Android/.test(ua) && /Version\/[\d.]+/.test(ua) && !/Chrome/.test(ua)) return true;
  // Injected bridge object from a native wrapper (set by the host app)
  if (typeof window.SpoolmeterXNative !== "undefined") return true;
  return false;
}