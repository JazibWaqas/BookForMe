export function normalizeMatchDateForApi(raw: string): string {
  const s = (raw || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date();
  const lower = s.toLowerCase();
  if (lower === 'today') {
    return d.toISOString().split('T')[0];
  }
  if (lower === 'tomorrow') {
    const t = new Date(d);
    t.setDate(t.getDate() + 1);
    return t.toISOString().split('T')[0];
  }
  const names: [string, number][] = [
    ['sunday', 0],
    ['monday', 1],
    ['tuesday', 2],
    ['wednesday', 3],
    ['thursday', 4],
    ['friday', 5],
    ['saturday', 6],
  ];
  for (const [name, dow] of names) {
    if (lower.includes(name)) {
      const out = new Date(d);
      const cur = out.getDay();
      let add = (dow - cur + 7) % 7;
      if (add === 0) add = 7;
      out.setDate(out.getDate() + add);
      return out.toISOString().split('T')[0];
    }
  }
  const fallback = new Date(d);
  fallback.setDate(fallback.getDate() + 1);
  return fallback.toISOString().split('T')[0];
}

export function normalizeMatchTimeForApi(raw: string): string {
  const s = (raw || '').trim();
  if (/^\d{1,2}:\d{2}$/.test(s) && !/am|pm/i.test(s)) {
    const [h, m] = s.split(':');
    return `${parseInt(h, 10).toString().padStart(2, '0')}:${m}`;
  }
  const m12 = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (m12) {
    let h = parseInt(m12[1], 10);
    const min = m12[2];
    const ap = m12[3].toUpperCase();
    if (ap === 'PM' && h < 12) h += 12;
    if (ap === 'AM' && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${min}`;
  }
  return '20:00';
}
