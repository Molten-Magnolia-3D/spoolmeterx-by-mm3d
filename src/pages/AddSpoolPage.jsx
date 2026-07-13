import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate, Link } from "react-router-dom";
import SpoolForm from "@/components/SpoolForm";
import SubPageHeader from "@/components/SubPageHeader";
import { useSubscription } from "@/hooks/useSubscription";

export default function AddSpoolPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeCount, setActiveCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => { base44.auth.me().then(setCurrentUser).catch(() => {}); }, []);
  const { spoolLimit } = useSubscription(currentUser);

  useEffect(() => {
    base44.entities.Spool.filter({ is_empty: false }).then(s => setActiveCount(s.length)).catch(() => {});
  }, []);

  const remaining = spoolLimit - activeCount;
  const pct = Math.min(100, Math.round((activeCount / spoolLimit) * 100));

  const handleSubmit = async (data) => {
    setError(null);
    const { quantity, ...spoolData } = data;
    const count = Math.max(1, parseInt(quantity) || 1);

    if (remaining <= 0) {
      setError(`You've reached your ${spoolLimit}-spool limit. Upgrade to add more.`);
      return;
    }

    const toAdd = Math.min(count, remaining);
    if (toAdd < count) {
      setError(`Only ${remaining} slot${remaining !== 1 ? "s" : ""} remaining — adding ${toAdd} instead of ${count}.`);
    }

    setLoading(true);
    try {
      if (toAdd === 1) {
        await base44.entities.Spool.create(spoolData);
      } else {
        await base44.entities.Spool.bulkCreate(Array.from({ length: toAdd }, () => ({ ...spoolData })));
      }
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-2xl mx-auto">
      <SubPageHeader
        title="Add Spool"
        fallback="/"
        right={
          <span className="text-xs text-muted-foreground font-medium">
            {activeCount}/{spoolLimit} used
          </span>
        }
      />

      {/* Capacity bar */}
      <div className="px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs text-muted-foreground">Spool slots used</p>
          <p className={`text-xs font-semibold ${remaining <= 0 ? "text-red-400" : remaining <= 5 ? "text-yellow-400" : "text-green-400"}`}>
            {remaining > 0 ? `${remaining} remaining` : "Limit reached"}
          </p>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-yellow-500" : "bg-primary"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-950/60 border-b border-red-800/50 text-red-300 text-sm flex items-center justify-between gap-2">
          <span>{error}</span>
          {activeCount >= spoolLimit && (
            <Link to="/pricing" className="font-semibold underline underline-offset-2 flex-shrink-0">Upgrade</Link>
          )}
        </div>
      )}

      {remaining <= 0 ? (
        <div className="px-4 py-12 text-center">
          <p className="text-2xl mb-3">📦</p>
          <p className="text-base font-semibold text-foreground mb-1">Spool limit reached</p>
          <p className="text-sm text-muted-foreground mb-5">You're using all {spoolLimit} slots on your current plan.</p>
          <Link to="/pricing" className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm">
            Upgrade to Add More
          </Link>
        </div>
      ) : (
        <div className="p-4 pb-8">
          <SpoolForm
            onSubmit={handleSubmit}
            onCancel={() => navigate(-1)}
            loading={loading}
            showQuantity
            maxQuantity={Math.max(1, remaining)}
          />
        </div>
      )}
    </div>
  );
}