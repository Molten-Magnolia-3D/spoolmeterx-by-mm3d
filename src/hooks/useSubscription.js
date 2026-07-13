import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

// Returns { plan, spoolLimit, status, loading, refresh }
export function useSubscription(user) {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user?.email) { setLoading(false); return; }
    try {
      const records = await base44.entities.UserSubscription.filter({ user_email: user.email });
      const active = records.find(r => r.status === "active") || records[0] || null;
      setSubscription(active);
    } catch {
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, [user?.email]);

  const plan = subscription?.status === "active" ? subscription.plan : "free";
  const spoolLimit = subscription?.status === "active" ? (subscription.spool_limit ?? 20) : 20;

  return { plan, spoolLimit, status: subscription?.status || "free", loading, refresh };
}