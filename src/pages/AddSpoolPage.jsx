import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import SpoolForm from "@/components/SpoolForm";
import SubPageHeader from "@/components/SubPageHeader";

export default function AddSpoolPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const syncBarcodeMapping = async (spoolData) => {
    if (!spoolData.barcode) return;
    const existing = await base44.entities.BarcodeMapping.filter({ barcode_value: spoolData.barcode });
    const payload = {
      barcode_value: spoolData.barcode,
      brand: spoolData.brand || "",
      material: spoolData.material,
      color_name: spoolData.color_name || "",
      color_hex: spoolData.color_hex || "",
      weight_grams: spoolData.starting_weight_grams || undefined,
    };
    if (existing.length > 0) {
      await base44.entities.BarcodeMapping.update(existing[0].id, payload);
    } else {
      await base44.entities.BarcodeMapping.create(payload);
    }
  };

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
      await syncBarcodeMapping(spoolData);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-2xl mx-auto">
      <SubPageHeader title="Add Spool" fallback="/" />
      <div className="p-4 pb-10">
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