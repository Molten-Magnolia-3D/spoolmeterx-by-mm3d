import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SpoolForm from "@/components/SpoolForm";
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
    base44.entities.Spool.filter({ is_empty: false }).then(spools => setActiveCount(spools.length)).catch(() => {});
  }, []);

  const handleSubmit = async (data) => {
    setError(null);
    const { quantity, ...spoolData } = data;
    const count = Math.max(1, parseInt(quantity) || 1);
    const remaining = spoolLimit - activeCount;

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
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/")} className="p-2 -ml-2 rounded-full active:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-foreground">Add Spool Manually</span>
        <span className="ml-auto text-xs text-muted-foreground">{activeCount}/{spoolLimit} spools</span>
      </div>
      {error && (
        <div className="px-4 py-3 bg-red-950/60 border-b border-red-800/50 text-red-300 text-sm flex items-center justify-between gap-2">
          <span>{error}</span>
          {activeCount >= spoolLimit && (
            <Link to="/pricing" className="font-semibold underline underline-offset-2 flex-shrink-0">Upgrade</Link>
          )}
        </div>
      )}
      <div className="p-4 pb-8">
        <SpoolForm
          onSubmit={handleSubmit}
          onCancel={() => navigate("/")}
          loading={loading}
          showQuantity
          maxQuantity={Math.max(1, spoolLimit - activeCount)}
        />
      </div>
    </div>
  );
}