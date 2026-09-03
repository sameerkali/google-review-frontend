/* Pure draft-assembly engine - no API call, no model. Given what the
   customer actually tapped, it snaps together one honest, editable sentence
   or two. Nothing appears here that the customer didn't select; low ratings
   are never softened. See review-expendifii-final-plan.md section 3.2. */

export type Band = "high" | "mid" | "low";
export type Aspect = "staff" | "speed" | "taste" | "portion" | "price" | "cleanliness" | "ambience" | "music";

const SKELETONS: Record<Band, ((item: string, aspect: string) => string)[]> = {
  high: [
    (i, a) => `Had the ${i} and it was really good.${a}`,
    (i, a) => `Came here for the ${i}, no complaints at all.${a}`,
    (i, a) => `The ${i} was worth coming back for.${a}`,
    (i, a) => `Ordered the ${i}. Good stuff.${a}`,
    (i, a) => `${cap(i)} was excellent.${a}`,
    (i, a) => `Really enjoyed the ${i} here.${a}`,
    (i, a) => `Went for the ${i} and it did not disappoint.${a}`,
    (i, a) => `Solid ${i}.${a}`,
    (i, a) => `The ${i} here is good.${a}`,
    (i, a) => `Tried the ${i}, would order it again.${a}`,
  ],
  mid: [
    (i, a) => `Had the ${i}. It was okay.${a}`,
    (i, a) => `Ordered the ${i}, decent but nothing special.${a}`,
    (i, a) => `The ${i} was fine.${a}`,
    (i, a) => `${cap(i)} was average.${a}`,
    (i, a) => `Tried the ${i}. Middling.${a}`,
    (i, a) => `Came for the ${i}, it was alright.${a}`,
    (i, a) => `The ${i} was okay, not more than that.${a}`,
    (i, a) => `Had the ${i} here. Mixed feelings.${a}`,
  ],
  low: [
    (i, a) => `Had the ${i} and it was not good.${a}`,
    (i, a) => `Ordered the ${i}, would not again.${a}`,
    (i, a) => `The ${i} was disappointing.${a}`,
    (i, a) => `${cap(i)} was poor.${a}`,
    (i, a) => `Not happy with the ${i}.${a}`,
    (i, a) => `Came for the ${i}. Bad experience.${a}`,
    (i, a) => `The ${i} was not worth it.${a}`,
    (i, a) => `Had the ${i}, would not recommend.${a}`,
  ],
};

const ASPECT_TEXT: Record<Band, Record<Aspect, string>> = {
  high: {
    staff: " Staff were friendly.",
    speed: " Service was quick.",
    taste: " Tasted great.",
    portion: " Portions were generous.",
    price: " Reasonably priced.",
    cleanliness: " Place was clean.",
    ambience: " Nice place to sit.",
    music: " Good music.",
  },
  mid: {
    staff: " Staff were okay.",
    speed: " Service took a while.",
    taste: " Taste was average.",
    portion: " Portions were small for the price.",
    price: " A bit pricey.",
    cleanliness: " Could be cleaner.",
    ambience: " Seating was cramped.",
    music: " Music was loud.",
  },
  low: {
    staff: " Staff were rude.",
    speed: " Waited far too long.",
    taste: " Food did not taste good.",
    portion: " Portions were too small.",
    price: " Overpriced.",
    cleanliness: " Not clean.",
    ambience: " Uncomfortable place to sit.",
    music: " Music was far too loud.",
  },
};

export const band = (r: number): Band => (r >= 4 ? "high" : r === 3 ? "mid" : "low");
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// A trailing clause naming whatever else was ordered, beyond the primary
// item the main skeleton already covers - named up to 2 more (3 items total
// read naturally; a fourth name onward starts reading like a receipt), with
// a light "and a few other things" tail so a big selection still shows up
// as *something* without turning into a list.
const EXTRA_ITEMS_TEXT: Record<Band, (joined: string, tail: string) => string> = {
  high: (joined, tail) => ` Also had the ${joined}${tail} - good too.`,
  mid: (joined, tail) => ` Also tried the ${joined}${tail}.`,
  low: (joined, tail) => ` Also had the ${joined}${tail}, no better.`,
};

function extraItemsClause(b: Band, extraItems: string[]): string {
  if (!extraItems.length) return "";
  const named = extraItems.slice(0, 2);
  const joined = named.length === 1 ? named[0] : `${named[0]} and ${named[1]}`;
  const tail = extraItems.length > named.length ? " and a few other things" : "";
  return EXTRA_ITEMS_TEXT[b](joined, tail);
}

export function buildDraft(
  { rating, items = [], aspects = [] }: { rating: number; items?: string[]; aspects?: Aspect[] },
  seed: number = Math.random()
): string {
  if (!rating) return "";
  const b = band(rating);

  const lowerItems = items.map((i) => i.toLowerCase());
  const item = lowerItems.length ? lowerItems[0] : null;
  const extraItems = lowerItems.slice(1);

  // Each aspect clause was written as a standalone trailing sentence, so
  // chaining several reads as an ordinary multi-sentence review rather than
  // a list - capped so picking every aspect doesn't run on forever.
  const usedAspects = aspects.slice(0, 4);
  const aspect = usedAspects.map((a) => ASPECT_TEXT[b][a] || "").join("");

  if (!item) {
    const fallback: Record<Band, string> = {
      high: `Good experience here.${aspect}`,
      mid: `It was okay.${aspect}`,
      low: `Not a good experience.${aspect}`,
    };
    return fallback[b];
  }

  const pool = SKELETONS[b];
  const base = pool[Math.floor(seed * pool.length)](item, aspect);
  return base + extraItemsClause(b, extraItems);
}
