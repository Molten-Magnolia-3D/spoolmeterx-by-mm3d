const REQUIRED = ["brand", "material", "color_name", "starting_weight_grams", "current_weight_grams"];
const FIELD_ALIASES = {
  "starting weight (g)": "starting_weight_grams",
  "current weight (g)": "current_weight_grams",
  "used (g)": null, // computed, skip
  "color hex": "color_hex",
  "color name": "color_name",
  "purchase price/kg ($)": "purchase_price_per_kg",
  "printer slot": "printer_slot",
  "date opened": "date_opened",
  "is empty": "is_empty",
};

function normalizeHeader(h) {
  const lower = h.trim().toLowerCase();
  if (FIELD_ALIASES[lower] !== undefined) return FIELD_ALIASES[lower];
  return lower.replace(/\s+/g, "_");
}

/**
 * Parses a CSV into spool rows and optional barcode mappings.
 * Returns { spools: [], barcodeMappings: [] }
 * barcodeMappings are only included for rows that have a non-empty barcode column.
 */
export function parseCsv(text) {
  const lines = text.trim().split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row.");

  const headers = lines[0].split(",").map(normalizeHeader);
  const spools = [];
  const barcodeMappings = [];

  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(",");
    const row = {};
    headers.forEach((h, idx) => {
      if (h === null) return; // skip computed fields
      row[h] = vals[idx]?.trim() ?? "";
    });

    // Coerce types
    if (row.starting_weight_grams) row.starting_weight_grams = parseFloat(row.starting_weight_grams) || 1000;
    if (row.current_weight_grams) row.current_weight_grams = parseFloat(row.current_weight_grams) || 1000;
    if (row.purchase_price_per_kg) row.purchase_price_per_kg = parseFloat(row.purchase_price_per_kg) || undefined;
    if (row.is_empty) row.is_empty = row.is_empty.toLowerCase() === "yes";

    // Validate required fields
    const missing = REQUIRED.filter(f => !row[f]);
    if (missing.length) continue; // skip invalid rows silently

    // Extract barcode before pushing spool row
    const barcodeValue = row.barcode;
    delete row.barcode;

    spools.push(row);

    // Build barcode mapping if barcode was provided
    if (barcodeValue) {
      barcodeMappings.push({
        barcode_value: barcodeValue,
        brand: row.brand || "",
        material: row.material || "",
        color_name: row.color_name || "",
        color_hex: row.color_hex || "",
        weight_grams: row.starting_weight_grams || undefined,
      });
    }
  }

  if (spools.length === 0) throw new Error("No valid rows found. Make sure required columns exist: brand, material, color_name, starting_weight_grams, current_weight_grams.");
  return { spools, barcodeMappings };
}