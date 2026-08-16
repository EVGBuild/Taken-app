export function formatPrice(value) {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR'
  }).format(+value);
}

export function durationLabel(minutes) {
  const n = Number(minutes);
  if (n < 60) return `Ongeveer ${n} minuten`;
  if (n === 60) return 'Ongeveer 1 uur';
  if (n % 60 === 0) return `Ongeveer ${n / 60} uur`;
  return `Ongeveer ${Math.floor(n / 60)} uur en ${n % 60} minuten`;
}
