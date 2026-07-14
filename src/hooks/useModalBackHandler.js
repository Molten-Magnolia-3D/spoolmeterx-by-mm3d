import { useEffect } from "react";

/**
 * Pushes a sentinel history entry when `isOpen` becomes true,
 * then intercepts the Android hardware back button (popstate) to call
 * `onClose` instead of navigating away.
 *
 * Usage:
 *   useModalBackHandler(showForm, () => setShowForm(false));
 */
export default function useModalBackHandler(isOpen, onClose) {
  useEffect(() => {
    if (!isOpen) return;

    // Push a dummy state so the back button has something to pop
    window.history.pushState({ modal: true }, "");

    const handler = (e) => {
      // If this popstate was triggered while our modal is open, intercept it
      onClose();
    };

    window.addEventListener("popstate", handler);
    return () => {
      window.removeEventListener("popstate", handler);
      // If the modal is closed programmatically (not via back), remove the
      // sentinel entry so the stack stays clean.
      if (window.history.state?.modal) {
        window.history.back();
      }
    };
  }, [isOpen]);
}