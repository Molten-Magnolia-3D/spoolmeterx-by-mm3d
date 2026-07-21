import { useEffect } from "react";

// Module-level flag: when a hook's cleanup pops its own sentinel history
// entry, it marks this so that whichever popstate listener is currently
// attached (possibly a *different* modal step's handler) knows to ignore
// that one event instead of treating it as a real back-button press.
let suppressNextPopstate = false;

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

    const handler = () => {
      if (suppressNextPopstate) {
        suppressNextPopstate = false;
        return;
      }
      onClose();
    };

    window.addEventListener("popstate", handler);
    return () => {
      window.removeEventListener("popstate", handler);
      // If the modal is closed programmatically (not via back), remove the
      // sentinel entry so the stack stays clean.
      if (window.history.state?.modal) {
        suppressNextPopstate = true;
        window.history.back();
      }
    };
  }, [isOpen]);
}
