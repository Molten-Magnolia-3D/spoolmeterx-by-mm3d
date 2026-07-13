// Shared swatch logic for single / multi / rainbow filaments

const RAINBOW = "linear-gradient(to right, #ff0000, #ff7700, #ffee00, #00cc00, #0000ff, #8b00ff)";

export function swatchStyle(spool) {
  if (spool.color_type === "rainbow") {
    return { background: RAINBOW };
  }
  if (spool.color_type === "multi" && spool.color_hex_list?.length > 1) {
    const stops = spool.color_hex_list
      .map((c, i, arr) => `${c} ${(i / arr.length) * 100}%, ${c} ${((i + 1) / arr.length) * 100}%`)
      .join(", ");
    return { background: `linear-gradient(to right, ${stops})` };
  }
  return { backgroundColor: spool.color_hex || "#888" };
}

export function SpoolSwatch({ spool, className = "" }) {
  return (
    <div
      className={className}
      style={swatchStyle(spool)}
    />
  );
}