import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function UpgradeSuccess() {
  const [status, setStatus] = useState("pending"); // pending | active | timeout
  const [plan, setPlan] = useState("");

  useEffect(() => {
    let attempts = 0;
    const poll = async () => {
      try {
        const user = await base44.auth.me();
        if (!user) return;
        const records = await base44.entities.UserSubscription.filter({ user_email: user.email });
        const active = records.find(r => r.status === "active");
        if (active) {
          setStatus("active");
          setPlan(active.plan);
          return;
        }
      } catch {}
      attempts++;
      if (attempts < 15) setTimeout(poll, 2000);
      else setStatus("timeout");
    };
    poll();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        {status === "pending" && (
          <>
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">Confirming your payment…</h1>
            <p className="text-muted-foreground text-sm">This usually takes just a few seconds.</p>
          </>
        )}
        {status === "active" && (
          <>
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">You're all set! 🎉</h1>
            <p className="text-muted-foreground text-sm mb-6 capitalize">
              Your <strong>{plan}</strong> plan is now active.
            </p>
            <Link to="/"><Button className="w-full">Go to Dashboard</Button></Link>
          </>
        )}
        {status === "timeout" && (
          <>
            <CheckCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">Payment received!</h1>
            <p className="text-muted-foreground text-sm mb-6">
              Your account is being activated — it should be ready in a minute. Refresh the dashboard if your plan hasn't updated yet.
            </p>
            <Link to="/"><Button className="w-full">Go to Dashboard</Button></Link>
          </>
        )}
      </div>
    </div>
  );
}