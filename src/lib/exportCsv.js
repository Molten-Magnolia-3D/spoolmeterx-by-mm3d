export function exportSpoolsCsv(spools) {
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

  const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `filament-inventory-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}