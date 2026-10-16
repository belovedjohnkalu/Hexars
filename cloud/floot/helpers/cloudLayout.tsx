type Item = { id: string; name: string; imageUrl?: string; percent: number };
type Rect = { x: number; y: number; width: number; height: number };
export function cloudLayout(items: Item[], width: number, height: number, measure: (text: string, size: number) => number) {
  const narrow = width < 600, gap = narrow ? 16 : 24;
  const cells = new Map<string, Rect[]>();
  const result: Array<Rect & { id: string; fontSize: number }> = [];
  const maxWidth = Math.max(120, Math.min(width - 40, narrow ? 280 : 440));
  function keys(rect: Rect) {
    const list: string[] = [];
    for (let x = Math.floor(rect.x / 128); x <= Math.floor((rect.x + rect.width) / 128); x++)
      for (let y = Math.floor(rect.y / 128); y <= Math.floor((rect.y + rect.height) / 128); y++) list.push(x + "," + y);
    return list;
  }
  for (const item of [...items].sort((a,b) => b.percent - a.percent || items.indexOf(a) - items.indexOf(b))) {
    const fontSize = (narrow ? 25 : 30) + item.percent / 100 * (narrow ? 25 : 42);
    let lines = 1, line = "", longest = 0;
    for (const char of item.name) {
      if (measure(line + char, fontSize) > maxWidth - 24 && line) { longest = Math.max(longest, measure(line, fontSize)); line = char; lines++; }
      else line += char;
    }
    longest = Math.max(longest, measure(line, fontSize));
    const picture = (narrow ? 112 : 144) + item.percent * .65;
    const w = item.imageUrl ? picture + 24 : Math.max(64, longest + 24);
    const h = item.imageUrl ? picture + 54 : lines * fontSize * 1.18 + 20;
    let chosen: Rect | null = null;
    for (let attempt = 0; attempt < 12000; attempt++) {
      const angle = attempt * 2.399963, radius = 10 * Math.sqrt(attempt);
      const x = Math.cos(angle) * radius * (narrow ? .85 : 1.65) - w / 2;
      const y = Math.sin(angle) * radius - h / 2;
      const index = result.length;
      const offset = Math.max(0, Math.min(width * .18, (width - w) / 2 - 16));
      if (index > 0 && index < 8 && (x + w / 2) * (index % 2 ? -1 : 1) < offset) continue;
      if (x < -width / 2 + 12 || x + w > width / 2 - 12) continue;
      const rect = { x, y, width: w + gap, height: h + gap };
      const overlaps = keys(rect).some(k => (cells.get(k) || []).some(r => rect.x < r.x + r.width && rect.x + rect.width > r.x && rect.y < r.y + r.height && rect.y + rect.height > r.y));
      if (!overlaps) { chosen = rect; break; }
    }
    if (!chosen) {
      const bottom = Math.max(0, ...result.map(r => r.y + r.height));
      chosen = { x: -w / 2, y: bottom + gap, width: w + gap, height: h + gap };
    }
    for (const k of keys(chosen)) cells.set(k, [...(cells.get(k) || []), chosen]);
    result.push({ ...chosen, width: w, height: h, id: item.id, fontSize });
  }
  const top = Math.min(0, ...result.map(r => r.y));
  const bottom = Math.max(0, ...result.map(r => r.y + r.height));
  const fullHeight = Math.max(height, bottom - top + 64);
  const offset = (fullHeight - (bottom - top)) / 2 - top;
  return { height: fullHeight, items: result.map(r => ({ ...r, x: r.x + width / 2, y: r.y + offset })) };
}
