import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SpoolForm from "@/components/SpoolForm";

export default function AddSpoolPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      await base44.entities.Spool.create(data);
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
      </div>
      <div className="p-4 pb-8">
        <SpoolForm
          onSubmit={handleSubmit}
          onCancel={() => navigate("/")}
          loading={loading}
        />
      </div>
    </div>
  );
}