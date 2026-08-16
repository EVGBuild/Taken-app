export function uid() {
  return Date.now().toString(36) + '-' + Math.random().toString(16).slice(2);
}

export function numericOrNull(value) {
  return value == null || value === ''
    ? null
    : Number.isFinite(Number(value))
      ? Number(value)
      : null;
}
