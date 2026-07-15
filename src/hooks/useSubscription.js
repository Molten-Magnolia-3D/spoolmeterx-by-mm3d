import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const DEFAULT_TRIAL_DAYS = 14;

async function getTrialDays() {
  try {
    const settings = await base44.entities.AppSettings.filter({ key: "trial_days" });
    if (settings.length > 0) return parseInt(settings[0].value) || DEFAULT_TRIAL_DAYS;
  } catch {}
  return DEFAULT_TRIAL_DAYS;
}

// Returns { plan, status, isTrialActive, trialDaysLeft, loading, refresh }
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

  const ensureTrial = async () => {
    if (!user?.email) return;
    try {
      const records = await base44.entities.UserSubscription.filter({ user_email: user.email });
      if (records.length === 0) {
        const trialDays = await getTrialDays();
        const trialEnds = new Date();
        trialEnds.setDate(trialEnds.getDate() + trialDays);
        await base44.entities.UserSubscription.create({
          user_email: user.email,
          user_id: user.id,
          plan: "trial",
          status: "active",
          trial_ends_at: trialEnds.toISOString(),
          is_beta: false,
        });
        await refresh();
      }
    } catch {
      // silent — trial creation is best-effort
    }
  };

  useEffect(() => {
    if (user?.email) {
      ensureTrial().then(refresh);
    } else {
      setLoading(false);
    }
  }, [user?.email]);

  // Derive trial status
  const isTrial = subscription?.plan === "trial" && subscription?.status === "active";
  const isBeta = subscription?.is_beta === true;
  const trialEndsAt = subscription?.trial_ends_at ? new Date(subscription.trial_ends_at) : null;
  const trialExpired = isTrial && !isBeta && trialEndsAt && new Date() > trialEndsAt;
  const isTrialActive = isTrial && !trialExpired;
  const trialDaysLeft = isTrialActive && trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;

  const hasAccess = (subscription?.status === "active" && !trialExpired);
  const plan = hasAccess ? subscription.plan : "free";

  return { plan, status: subscription?.status || "free", isTrialActive, trialDaysLeft, isBeta, loading, refresh };
}