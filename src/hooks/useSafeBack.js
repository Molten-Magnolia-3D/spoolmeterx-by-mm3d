import { useNavigate } from "react-router-dom";

/**
 * Returns a goBack function that navigates back if history exists,
 * otherwise falls back to the given fallback route (default: "/").
 */
export default function useSafeBack(fallback = "/") {
  const navigate = useNavigate();
  return () => {
    // navigate(-1) is unreliable when the app was loaded directly on a sub-page
    // (browser history always has length > 1). Use router state delta instead.
    if (window.history.state?.idx > 0) {
      navigate(-1);
    } else {
      navigate(fallback, { replace: true });
    }
  };
}