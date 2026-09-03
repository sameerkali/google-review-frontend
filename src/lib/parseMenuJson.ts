export type ParsedMenuItem = { name: string; price?: number; category?: string };

export const MENU_JSON_EXAMPLE = JSON.stringify(
  [
    { id: 1, name: "Cold Brew", price: 150, category: "Drinks" },
    { id: 2, name: "Cappuccino", price: 120, category: "Drinks" },
    { id: 3, name: "Club Sandwich", price: 220, category: "Mains" },
  ],
  null,
  2
);

/* Accepts the documented {id, name, price, category} shape - `id` is read
   and ignored (Mongo assigns its own on insert; it's only there so a menu
   exported elsewhere with its own ids can be pasted in unmodified) - but
   also tolerates {items:[...]} and a plain array of name strings with no
   price/category, so JSON from an earlier version of this uploader still
   works. */
export function parseMenuJson(raw: string): { items: ParsedMenuItem[]; error?: undefined } | { items?: undefined; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "That's not valid JSON - check for missing commas or quotes" };
  }

  const obj = parsed as Record<string, unknown> | null;
  const arr = Array.isArray(parsed) ? parsed : Array.isArray(obj?.items) ? (obj!.items as unknown[]) : null;
  if (!arr) return { error: 'Expected a JSON array of {"name": "...", "price": ...} items, or plain name strings' };

  const items: ParsedMenuItem[] = [];
  for (const it of arr) {
    if (typeof it === "string") {
      if (it.trim()) items.push({ name: it.trim() });
      continue;
    }
    if (it && typeof it === "object" && typeof (it as Record<string, unknown>).name === "string") {
      const o = it as Record<string, unknown>;
      const name = String(o.name).trim();
      if (!name) continue;
      const price = typeof o.price === "number" && !isNaN(o.price) ? o.price : undefined;
      const category = typeof o.category === "string" && o.category.trim() ? o.category.trim() : undefined;
      items.push({ name, price, category });
      continue;
    }
    return { error: 'Expected a JSON array of {"name": "...", "price": ...} items, or plain name strings' };
  }

  if (!items.length) return { error: "No item names found in that JSON" };
  return { items };
}
