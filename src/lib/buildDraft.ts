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

export function buildDraft(
  { rating, items = [], aspects = [] }: { rating: number; items?: string[]; aspects?: Aspect[] },
  seed: number = Math.random()
): string {
  if (!rating) return "";
  const b = band(rating);

  // One item only - listing three reads manufactured.
  const item = items.length ? items[0].toLowerCase() : null;
  // One aspect only - two sentences maximum.
  const aspect = aspects.length ? ASPECT_TEXT[b][aspects[0]] || "" : "";

  if (!item) {
    const fallback: Record<Band, string> = {
      high: `Good experience here.${aspect}`,
      mid: `It was okay.${aspect}`,
      low: `Not a good experience.${aspect}`,
    };
    return fallback[b];
  }

  const pool = SKELETONS[b];
  return pool[Math.floor(seed * pool.length)](item, aspect);
}
