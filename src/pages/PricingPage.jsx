import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Check, Zap, Star, Crown, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    icon: <Zap className="w-5 h-5" />,
    color: "text-muted-foreground",
    border: "border-border",
    spools: 20,
    features: ["Track up to 20 spools", "Barcode scanning", "Usage logging", "CSV export/import", "Quick Jobs macros"],
    cta: "Your current plan",
    disabled: true,
  },
  {
    id: "hobby",
    name: "Hobby",
    price: "$5",
    period: "/ month",
    icon: <Star className="w-5 h-5" />,
    color: "text-blue-400",
    border: "border-blue-500/50",
    highlight: false,
    spools: 50,
    features: ["Track up to 50 spools", "Everything in Free", "Priority support"],
    cta: "Get Hobby",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$10",
    period: "/ month",
    icon: <Crown className="w-5 h-5" />,
    color: "text-yellow-400",
    border: "border-yellow-500/50",
    highlight: true,
    spools: "Unlimited",
    features: ["Unlimited spools", "Everything in Hobby", "Early access to new features"],
    cta: "Get Pro",
  },
  {
    id: "lifetime",
    name: "Lifetime",
    price: "$149",
    period: "one-time",
    icon: <Crown className="w-5 h-5 text-purple-400" />,
    color: "text-purple-400",
    border: "border-purple-500/50",
    spools: "Unlimited",
    features: ["Unlimited spools forever", "All future updates included", "Everything in Pro", "No monthly fees — ever"],
    cta: "Buy Lifetime Access",
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState("");

  const handleUpgrade = async (planId) => {
    setLoading(planId);
    setError("");
    try {
      const res = await base44.functions.invoke("create-checkout", { plan: planId });
      if (res.data?.redirectUrl) {
        window.location.href = res.data.redirectUrl;
      } else {
        setError(res.data?.error || "Could not start checkout. Please try again.");
      }
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground text-sm mb-6 hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to dashboard
          </Link>
          <h1 className="text-3xl font-bold text-foreground font-heading">Upgrade FilamentFlow</h1>
          <p className="text-muted-foreground mt-2">Pick the plan that fits your shop. Cancel anytime.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/20 border border-destructive/40 text-destructive text-sm">{error}</div>
        )}

        {/* Plans */}
        <div className="space-y-4">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-xl border bg-card p-5 ${plan.border} ${plan.highlight ? "ring-2 ring-yellow-500/40" : ""}`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-4 bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">Most Popular</span>
              )}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={plan.color}>{plan.icon}</span>
                    <h2 className="text-lg font-bold text-foreground">{plan.name}</h2>
                  </div>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-shrink-0 pt-1">
                  <Button
                    onClick={() => !plan.disabled && handleUpgrade(plan.id)}
                    disabled={plan.disabled || loading === plan.id}
                    variant={plan.highlight ? "default" : "outline"}
                    className={`whitespace-nowrap ${plan.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {loading === plan.id ? "Redirecting…" : plan.cta}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Payments are processed securely. Subscriptions can be canceled anytime.
        </p>
      </div>
    </div>
  );
}