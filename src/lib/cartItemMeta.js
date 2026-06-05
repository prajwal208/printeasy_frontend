/** Turn compact API values like "46Y" into display labels like "4-6Y". */
function formatCompactYearSize(str) {
  const trimmed = String(str).trim();
  if (!trimmed) return null;
  if (trimmed.includes("-")) return trimmed;

  const match = trimmed.match(/^(\d+)y$/i);
  if (!match) return trimmed;

  const digits = match[1];
  for (let i = 1; i < digits.length; i++) {
    const start = Number(digits.slice(0, i));
    const end = Number(digits.slice(i));
    if (start <= 18 && end <= 18 && end > start) {
      return `${digits.slice(0, i)}-${digits.slice(i)}Y`;
    }
  }

  return trimmed;
}

export function getCartItemSizeLabel(item) {
  const opts = item?.options;
  if (!opts) return null;
  if (typeof opts === "string") {
    const trimmed = opts.trim();
    return trimmed ? formatCompactYearSize(trimmed) : null;
  }
  if (typeof opts === "object") {
    const label = (opts.label || "").trim();
    if (label) return label;
    const value = (opts.value || "").trim();
    return value ? formatCompactYearSize(value) : null;
  }
  return null;
}

function pickProductColor(item) {
  return (
    item?.productColor ||
    item?.color ||
    item?.shirtColor ||
    item?.colour ||
    null
  );
}

function pickPrintType(item) {
  return (
    item?.printType ||
    item?.printMethod ||
    item?.print_type ||
    (item?.isCustomizable ? "DTF Print" : null)
  );
}

/** Attribute pills shown under custom print on cart cards (Size, color, print). */
export function getCartItemAttributeTags(item) {
  const tags = [];

  const size = getCartItemSizeLabel(item);
  if (size) tags.push({ key: "size", label: `Size: ${size}` });

  const color = pickProductColor(item);
  if (color) tags.push({ key: "color", label: color });

  const print = pickPrintType(item);
  if (print) tags.push({ key: "print", label: print });

  return tags;
}
