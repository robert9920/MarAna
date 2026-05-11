export function formatCurrency(value) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2
  }).format(Number(value || 0));
}

export function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function getPrimaryImage(product) {
  const images = product?.images || [];
  return images.find((image) => image.is_primary) || images[0] || null;
}

export function productImageUrl(product) {
  const primary = getPrimaryImage(product);
  return primary?.image_url || primary?.public_url || "";
}

export const genderLabels = {
  mujer: "Mujer",
  hombre: "Hombre",
  unisex: "Unisex",
  niña: "Niña",
  niño: "Niño"
};

export function formatGender(value) {
  return genderLabels[value] || "";
}

export function normalizeSizesInput(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function sizesToInput(sizes) {
  return (sizes || []).join(", ");
}
