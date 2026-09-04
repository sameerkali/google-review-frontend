/* Pure draft-assembly engine - no API call, no model. Given what the
   customer actually tapped, it snaps together one honest, editable sentence
   or two. Nothing appears here that the customer didn't select. Low ratings
   stay honest about the problem but are phrased as constructive feedback
   (what fell short, hoping it improves) rather than a rant - a business
   reading it should come away knowing what to fix, not just that someone
   was upset. See review-expendifii-final-plan.md section 3.2. */

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
    (i, a) => `Had the ${i}, but it didn't quite hit the mark.${a}`,
    (i, a) => `Ordered the ${i} - there's room for improvement.${a}`,
    (i, a) => `The ${i} fell a bit short this time.${a}`,
    (i, a) => `${cap(i)} could use some work.${a}`,
    (i, a) => `Wasn't fully satisfied with the ${i}, but open to trying again.${a}`,
    (i, a) => `Came for the ${i} - a rough visit, hoping it gets better.${a}`,
    (i, a) => `The ${i} needs some improvement.${a}`,
    (i, a) => `Had the ${i}; wouldn't recommend it as is, but hoping it improves.${a}`,
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
    staff: " Staff could be friendlier.",
    speed: " Service could be quicker.",
    taste: " Taste could use some work.",
    portion: " Portions could be a bit bigger.",
    price: " A little pricey for what you get.",
    cleanliness: " Cleanliness could be better.",
    ambience: " Seating could be more comfortable.",
    music: " Music could be turned down a bit.",
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
  low: (joined, tail) => ` Also tried the ${joined}${tail}, hoping for better next time.`,
};

function extraItemsClause(b: Band, extraItems: string[]): string {
  if (!extraItems.length) return "";
  const named = extraItems.slice(0, 2);
  const joined = named.length === 1 ? named[0] : `${named[0]} and ${named[1]}`;
  const tail = extraItems.length > named.length ? " and a few other things" : "";
  return EXTRA_ITEMS_TEXT[b](joined, tail);
}

export function buildDraft(
  {
    rating,
    items = [],
    aspects = [],
    experienceRating,
  }: { rating: number; items?: string[]; aspects?: Aspect[]; experienceRating?: number },
  seed: number = Math.random()
): string {
  if (!rating) return "";
  const b = band(rating);
  // Staff/speed/cleanliness etc. are about the experience, not the food -
  // a bad meal with great service (or the reverse) is common and the two
  // shouldn't be forced to share one sentiment. When the customer gave a
  // separate experience rating, aspect clauses use that band; otherwise
  // (no aspects picked, or an older session with no second rating) they
  // fall back to the food band, same as before.
  const aspectBand = experienceRating ? band(experienceRating) : b;

  const lowerItems = items.map((i) => i.toLowerCase());
  const item = lowerItems.length ? lowerItems[0] : null;
  const extraItems = lowerItems.slice(1);

  // Each aspect clause was written as a standalone trailing sentence, so
  // chaining several reads as an ordinary multi-sentence review rather than
  // a list - capped so picking every aspect doesn't run on forever.
  const usedAspects = aspects.slice(0, 4);
  const aspect = usedAspects.map((a) => ASPECT_TEXT[aspectBand][a] || "").join("");

  if (!item) {
    const fallback: Record<Band, string> = {
      high: `Good experience here.${aspect}`,
      mid: `It was okay.${aspect}`,
      low: `Room for improvement here.${aspect}`,
    };
    return fallback[b];
  }

  const pool = SKELETONS[b];
  const base = pool[Math.floor(seed * pool.length)](item, aspect);
  return base + extraItemsClause(b, extraItems);
}
