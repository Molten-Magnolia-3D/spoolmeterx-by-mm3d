import { base44 } from "@/api/base44Client";

export async function syncBarcodeMapping(spoolData) {
  if (!spoolData.barcode) return;
  try {
    const existing = await base44.entities.BarcodeMapping.filter({ barcode_value: spoolData.barcode });
    const payload = {
      barcode_value: spoolData.barcode,
      brand: spoolData.brand || "",
      material: spoolData.material || "",
      color_name: spoolData.color_name || "",
      color_hex: spoolData.color_hex || "",
      weight_grams: spoolData.starting_weight_grams || undefined,
    };
    if (existing.length > 0) {
      await base44.entities.BarcodeMapping.update(existing[0].id, payload);
    } else {
      await base44.entities.BarcodeMapping.create(payload);
    }
  } catch (e) {
    console.error("syncBarcodeMapping failed:", e);
  }
}