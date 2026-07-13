import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { ArrowLeft, Tag, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RedeemCodePage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");


  const handleRedeem = async () => {
    if (!code.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res = await base44.functions.invoke("redeem-promo-code", { code: code.trim() });
      setSuccess({ plan: res.data.plan, days: res.data.days });
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/" className="p-2 -ml-2 rounded-full active:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="font-bold text-foreground">Redeem Code</span>
      </div>

      <div className="p-6 max-w-sm mx-auto">
        {success ? (
          <div className="text-center space-y-4 pt-10">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Code Redeemed!</h2>
            <p className="text-muted-foreground">
              You now have <span className="text-foreground font-semibold capitalize">{success.plan}</span> access for <span className="text-foreground font-semibold">{success.days} days</span>.
            </p>
            <Link to="/">
              <Button className="w-full h-12 mt-4">Go to Dashboard</Button>
            </Link>
          </div>
        ) : (
          <div className="pt-10 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Tag className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1">Enter your code</h2>
              <p className="text-sm text-muted-foreground">Got a promo or trial code? Enter it below to unlock access.</p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
            )}

            <div className="space-y-3">
              <Input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === "Enter" && handleRedeem()}
                placeholder="YOURCODE"
                className="h-14 bg-muted border-border text-foreground font-mono text-xl text-center tracking-widest"
              />
              <Button onClick={handleRedeem} disabled={loading || !code.trim()} className="w-full h-12 font-semibold">
                {loading ? "Checking…" : "Redeem Code"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}