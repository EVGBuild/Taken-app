function todayKey() {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0')
  ].join('-');
}

function formatDate(iso) {
  return new Date(iso + 'T12:00').toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function formatDateLong(iso) {
  return new Date(iso + 'T12:00').toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function parseDutchDate(value) {
  const raw = value.trim();
  if (!raw) return { iso: '', display: '' };

  let d;
  let m;
  let y;
  const parts = raw.split(/[-/\.\s]+/).filter(Boolean);

  if (parts.length === 3) {
    [d, m, y] = parts;
  } else if (/^\d+$/.test(raw)) {
    if (raw.length === 8 || raw.length === 6) {
      d = raw.slice(0, 2);
      m = raw.slice(2, 4);
      y = raw.slice(4);
    } else if (raw.length === 5) {
      d = raw.slice(0, 2);
      m = raw.slice(2, 3);
      y = raw.slice(3);
    } else {
      return null;
    }
  } else {
    return null;
  }

  d = +d;
  m = +m;
  y = +y;
  if (y < 100) y += 2000;

  const date = new Date(y, m - 1, d);
  if (
    y < 2000 ||
    y > 2099 ||
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) return null;

  const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return { iso, display: formatDateLong(iso) };
}

function nextDue(date, every, unit) {
  const d = new Date(date + 'T12:00');
  const n = Number(every) || 1;
  if (unit === 'days') d.setDate(d.getDate() + n);
  if (unit === 'weeks') d.setDate(d.getDate() + 7 * n);
  if (unit === 'months') d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}

function recurrenceLabel(repeat) {
  const every = +(repeat?.every) || 1;
  const unit = repeat?.unit || 'weeks';
  if (unit === 'days') return every === 1 ? 'Dagelijks' : `Elke ${every} dagen`;
  if (unit === 'weeks') return every === 1 ? 'Wekelijks' : `Elke ${every} weken`;
  if (unit === 'months') {
    if (every === 1) return 'Maandelijks';
    if (every === 3) return 'Per kwartaal';
    if (every === 6) return 'Halfjaarlijks';
    return `Elke ${every} maanden`;
  }
  if (unit === 'years') return every === 1 ? 'Jaarlijks' : `Elke ${every} jaar`;
  return `Elke ${every} weken`;
}
