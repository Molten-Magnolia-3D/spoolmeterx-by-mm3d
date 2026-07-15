/**
 * Build CSV string from spools array.
 */
export function buildSpoolsCsv(spools) {
  const headers = [
    "Brand", "Material", "Color Name", "Color Hex",
    "Starting Weight (g)", "Current Weight (g)", "Used (g)",
    "Purchase Price/kg ($)", "Printer Slot", "Barcode",
    "Date Opened", "Notes", "Is Empty"
  ];

  const rows = spools.map(s => [
    s.brand,
    s.material,
    s.color_name,
    s.color_hex || "",
    s.starting_weight_grams,
    s.current_weight_grams,
    Math.max(0, s.starting_weight_grams - s.current_weight_grams),
    s.purchase_price_per_kg || "",
    s.printer_slot || "",
    s.barcode || "",
    s.date_opened || "",
    (s.notes || "").replace(/,/g, ";"),
    s.is_empty ? "Yes" : "No",
  ]);

  return [headers, ...rows].map(r => r.join(",")).join("\n");
}

/**
 * Attempts a direct browser download. Returns false if not supported
 * (e.g. Android WebView blocks blob: URL navigations).
 */
export function exportSpoolsCsv(spools) {
  const csv = buildSpoolsCsv(spools);
  const filename = `filament-inventory-${new Date().toISOString().split("T")[0]}.csv`;

  try {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}