export function roadLabel(value) {
  if (typeof value !== "string") return null;

  const name = value.trim();
  if (
    !name ||
    /^(?:N\/D|N\/A)$/i.test(name) ||
    /^[\d\s./-]+[A-Z]?$/i.test(name) ||
    /^[A-Z]{1,4}[- ]*\d[\d\s./-]*[A-Z]?$/i.test(name)
  ) {
    return null;
  }

  return name;
}
