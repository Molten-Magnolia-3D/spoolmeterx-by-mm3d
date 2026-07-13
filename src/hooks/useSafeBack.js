import { useNavigate } from "react-router-dom";

/**
 * Returns a goBack function that navigates back if history exists,
 * otherwise falls back to the given fallback route (default: "/").
 */
export default function useSafeBack(fallback = "/") {
  const navigate = useNavigate();
  return () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallback, { replace: true });
    }
  };
}