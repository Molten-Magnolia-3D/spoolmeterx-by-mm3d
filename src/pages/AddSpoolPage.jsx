import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import SpoolForm from "@/components/SpoolForm";
import SubPageHeader from "@/components/SubPageHeader";

export default function AddSpoolPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data) => {
    const { quantity, ...spoolData } = data;
    const count = Math.max(1, parseInt(quantity) || 1);
    setLoading(true);
    try {
      if (count === 1) {
        await base44.entities.Spool.create(spoolData);
      } else {
        await base44.entities.Spool.bulkCreate(Array.from({ length: count }, () => ({ ...spoolData })));
      }
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-2xl mx-auto">
      <SubPageHeader title="Add Spool" fallback="/" />
      <div className="p-4 pb-8">
        <SpoolForm
          onSubmit={handleSubmit}
          onCancel={() => navigate(-1)}
          loading={loading}
          showQuantity
        />
      </div>
    </div>
  );
}