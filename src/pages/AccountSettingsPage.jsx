import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useSubscription } from "@/hooks/useSubscription";
import SubPageHeader from "@/components/SubPageHeader";
import { Button } from "@/components/ui/button";
import DeleteAccountDialog from "@/components/DeleteAccountDialog";
import {
  LogOut, Trash2, ChevronRight, Crown,
  CreditCard, ReceiptText, User, ShieldCheck, Mail
} from "lucide-react";

function SectionHeader({ children }) {
  return (
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 pt-5 pb-1">
      {children}
    </p>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 bg-card border-b border-border/50">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm text-foreground font-medium ${mono ? "font-mono" : ""}`}>{value || "—"}</p>
    </div>
  );
}

const PLAN_LABELS = {
  free: { label: "Free", color: "text-muted-foreground", bg: "bg-muted" },
  trial: { label: "Free Trial", color: "text-yellow-400", bg: "bg-yellow-400/10" },
  pro: { label: "Pro", color: "text-primary", bg: "bg-primary/10" },
  lifetime: { label: "Lifetime", color: "text-emerald-400", bg: "bg-emerald-400/10" },
};

export default function AccountSettingsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [resetSent, setResetSent] = useState(false);
  const [resetSending, setResetSending] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const { plan, isTrialActive, trialDaysLeft, isBeta, refresh } = useSubscription(currentUser);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (currentUser?.email) {
      base44.entities.UserSubscription.filter({ user_email: currentUser.email })
        .then(records => {
          const active = records.find(r => r.status === "active") || records[0] || null;
          setSubscription(active);
        })
        .catch(() => {});
    }
  }, [currentUser?.email]);

  const handleUpgrade = async () => {
    setCheckingOut(true);
    setCheckoutError("");
    try {
      const res = await base44.functions.invoke("create-checkout", { plan: "pro" });
      if (res?.data?.redirectUrl) {
        window.location.href = res.data.redirectUrl;
      } else {
        setCheckoutError(res?.data?.error || "Could not start checkout.");
      }
    } catch (e) {
      setCheckoutError(e.message || "Checkout failed.");
    } finally {
      setCheckingOut(false);
    }
  };

  const isPro = plan === "pro" || plan === "lifetime";
  const planMeta = PLAN_LABELS[plan] || PLAN_LABELS.free;

  const handleSendResetLink = async () => {
    if (!currentUser?.email) return;
    setResetSending(true);
    await base44.auth.resetPasswordRequest(currentUser.email).catch(() => {});
    setResetSending(false);
    setResetSent(true);
  };

  const memberSince = currentUser?.created_date
    ? new Date(currentUser.created_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;

  const trialEndsDisplay = subscription?.trial_ends_at
    ? new Date(subscription.trial_ends_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-background pb-24 max-w-2xl mx-auto">
      <SubPageHeader title="Account" fallback="/settings" />

      {/* Profile card */}
      <div className="mx-4 mt-4 mb-2 bg-card rounded-xl border border-border/60 p-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <User className="w-7 h-7 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-foreground text-base truncate">{currentUser?.full_name || "Your Account"}</p>
          <p className="text-xs text-muted-foreground truncate">{currentUser?.email || ""}</p>
          <div className="mt-1.5">
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${planMeta.bg} ${planMeta.color}`}>
              {isPro && <Crown className="w-3 h-3" />}
              {isTrialActive ? `Trial · ${trialDaysLeft}d left` : planMeta.label}
            </span>
          </div>
        </div>
      </div>

      {/* Login info */}
      <SectionHeader>Login Info</SectionHeader>
      <div className="divide-y divide-border/50">
        <InfoRow label="Name" value={currentUser?.full_name} />
        <InfoRow label="Email" value={currentUser?.email} mono />
        {/* Password row */}
        <div className="flex items-center justify-between px-4 py-3.5 bg-card border-b border-border/50">
          <p className="text-xs text-muted-foreground">Password</p>
          {resetSent ? (
            <p className="text-xs text-green-400 font-medium">Link sent to your email ✓</p>
          ) : (
            <button
              type="button"
              onClick={handleSendResetLink}
              disabled={resetSending}
              className="flex items-center gap-1.5 text-xs text-primary font-medium bg-primary/10 px-3 py-1.5 rounded-lg active:bg-primary/20 disabled:opacity-50"
            >
              <Mail className="w-3.5 h-3.5" />
              {resetSending ? "Sending…" : "Send reset link"}
            </button>
          )}
        </div>
        {memberSince && <InfoRow label="Member since" value={memberSince} />}
        {currentUser?.role === "admin" && <InfoRow label="Role" value="Admin" />}
      </div>

      {/* Subscription */}
      <SectionHeader>Subscription</SectionHeader>
      <div className="bg-card border-b border-border/50 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {isTrialActive ? "Free Trial" : isPro ? "Pro Plan" : "Free Plan"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {plan === "free" && !isTrialActive && "Includes ads · Quick Jobs locked"}
              {isTrialActive && `${trialDaysLeft} day${trialDaysLeft !== 1 ? "s" : ""} remaining`}
              {isTrialActive && trialEndsDisplay && ` · Ends ${trialEndsDisplay}`}
              {isPro && !isTrialActive && "No ads · Full Quick Jobs · Unlimited spools"}
            </p>
            {subscription?.subscription_id && (
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">ID: {subscription.subscription_id.slice(0, 16)}…</p>
            )}
          </div>
          {!isPro && (
            <button
              onClick={handleUpgrade}
              disabled={checkingOut}
              className="flex-shrink-0 flex items-center gap-1.5 text-sm text-primary font-semibold bg-primary/10 px-3 py-1.5 rounded-lg active:bg-primary/20 disabled:opacity-50"
            >
              <Crown className="w-3.5 h-3.5" />
              {checkingOut ? "Loading…" : "Upgrade"}
            </button>
          )}
        </div>
        {checkoutError && <p className="text-xs text-destructive mt-2">{checkoutError}</p>}
      </div>

      {/* Quick links */}
      <SectionHeader>Manage</SectionHeader>
      <div className="divide-y divide-border/50">
        <Link to="/redeem" className="flex items-center justify-between px-4 py-3.5 bg-card active:bg-muted">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm text-foreground font-medium">Redeem Promo / Trial Code</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </Link>
        {isPro && subscription?.subscription_id && (
          <Link to="/pricing" className="flex items-center justify-between px-4 py-3.5 bg-card active:bg-muted">
            <div className="flex items-center gap-3">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-foreground font-medium">Manage Billing</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        )}
        {!isPro && (
          <Link to="/pricing" className="flex items-center justify-between px-4 py-3.5 bg-card active:bg-muted">
            <div className="flex items-center gap-3">
              <Crown className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-foreground font-medium">View Plans & Pricing</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        )}
        {currentUser?.role === "admin" && (
          <Link to="/admin" className="flex items-center justify-between px-4 py-3.5 bg-card active:bg-muted">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-foreground font-medium">Admin Panel</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        )}
      </div>

      {/* Transaction history */}
      <SectionHeader>Transaction History</SectionHeader>
      <div className="bg-card border-b border-border/50 divide-y divide-border/50">
        {subscription ? (
          <>
            <div className="px-4 py-3.5 flex items-center gap-3">
              <ReceiptText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground capitalize">
                  {subscription.trial_ends_at && subscription.plan === "trial"
                    ? `Expires ${new Date(subscription.trial_ends_at).toLocaleDateString()}`
                    : subscription.plan === "pro" ? "SpoolmeterX Pro · $5.99/mo · Auto-renewing" : ""}
                </p>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                subscription.status === "active" ? "bg-emerald-400/10 text-emerald-400" :
                subscription.status === "canceled" ? "bg-destructive/10 text-destructive" :
                "bg-muted text-muted-foreground"
              }`}>
                {subscription.status}
              </span>
            </div>
          </>
        ) : (
          <div className="px-4 py-5 text-center">
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
          </div>
        )}
      </div>

      {/* Account actions */}
      <SectionHeader>Account Actions</SectionHeader>
      <div className="bg-card border-b border-border/50 px-4 py-4 space-y-3">
        <Button
          variant="outline"
          className="w-full h-11 gap-2 border-border text-foreground"
          onClick={() => base44.auth.logout("/login")}
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>
        <Button
          variant="outline"
          className="w-full h-11 gap-2 border-destructive/50 text-destructive"
          onClick={() => setShowDeleteAccount(true)}
        >
          <Trash2 className="w-4 h-4" /> Delete Account
        </Button>
      </div>

      {showDeleteAccount && <DeleteAccountDialog onClose={() => setShowDeleteAccount(false)} />}
    </div>
  );
}