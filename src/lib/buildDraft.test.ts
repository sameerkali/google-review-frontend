import { describe, expect, it } from "vitest";
import { band, buildDraft } from "./buildDraft";

describe("band", () => {
  it("buckets 1-2 stars as low", () => {
    expect(band(1)).toBe("low");
    expect(band(2)).toBe("low");
  });
  it("buckets 3 stars as mid", () => {
    expect(band(3)).toBe("mid");
  });
  it("buckets 4-5 stars as high", () => {
    expect(band(4)).toBe("high");
    expect(band(5)).toBe("high");
  });
});

describe("buildDraft", () => {
  it("returns an empty string with no rating", () => {
    expect(buildDraft({ rating: 0 })).toBe("");
  });

  it("falls back to a generic sentence with no items selected", () => {
    expect(buildDraft({ rating: 5 }, 0)).toBe("Good experience here.");
    expect(buildDraft({ rating: 3 }, 0)).toBe("It was okay.");
    expect(buildDraft({ rating: 1 }, 0)).toBe("Not a good experience.");
  });

  it("appends the aspect clause to the fallback when no item is selected", () => {
    expect(buildDraft({ rating: 5, aspects: ["staff"] }, 0)).toBe("Good experience here. Staff were friendly.");
  });

  it("lowercases the item name and uses the seed to pick a deterministic skeleton", () => {
    const text = buildDraft({ rating: 5, items: ["Butter Chicken"] }, 0);
    expect(text).toBe("Had the butter chicken and it was really good.");
  });

  it("a different seed picks a different skeleton from the same pool", () => {
    const first = buildDraft({ rating: 5, items: ["Butter Chicken"] }, 0);
    const second = buildDraft({ rating: 5, items: ["Butter Chicken"] }, 0.99);
    expect(first).not.toBe(second);
  });

  it("appends a single aspect clause after the item sentence", () => {
    const text = buildDraft({ rating: 5, items: ["Butter Chicken"], aspects: ["speed"] }, 0);
    expect(text).toBe("Had the butter chicken and it was really good. Service was quick.");
  });

  it("chains multiple aspect clauses in selection order, capped at 4", () => {
    const text = buildDraft(
      { rating: 5, items: ["Butter Chicken"], aspects: ["staff", "speed", "taste", "portion", "price"] },
      0
    );
    // 5 aspects selected, only the first 4 should appear.
    expect(text).toBe(
      "Had the butter chicken and it was really good. Staff were friendly. Service was quick. Tasted great. Portions were generous."
    );
  });

  it("names a second selected item in its own trailing clause", () => {
    const text = buildDraft({ rating: 5, items: ["Butter Chicken", "Garlic Naan"] }, 0);
    expect(text).toBe("Had the butter chicken and it was really good. Also had the garlic naan - good too.");
  });

  it("names up to two extra items, joined with 'and'", () => {
    const text = buildDraft({ rating: 5, items: ["Butter Chicken", "Garlic Naan", "Dal Makhani"] }, 0);
    expect(text).toBe("Had the butter chicken and it was really good. Also had the garlic naan and dal makhani - good too.");
  });

  it("adds a generic tail instead of naming a fourth-plus item", () => {
    const text = buildDraft({ rating: 5, items: ["Butter Chicken", "Garlic Naan", "Dal Makhani", "Raita"] }, 0);
    expect(text).toBe(
      "Had the butter chicken and it was really good. Also had the garlic naan and dal makhani and a few other things - good too."
    );
  });

  it("uses band-appropriate phrasing for a low rating with multiple items", () => {
    const text = buildDraft({ rating: 1, items: ["Butter Chicken", "Garlic Naan"] }, 0);
    expect(text).toBe("Had the butter chicken and it was not good. Also had the garlic naan, no better.");
  });

  it("is longer for a rich selection than a minimal one", () => {
    const short = buildDraft({ rating: 5, items: ["Butter Chicken"] }, 0);
    const long = buildDraft(
      { rating: 5, items: ["Butter Chicken", "Garlic Naan", "Dal Makhani"], aspects: ["staff", "speed", "taste"] },
      0
    );
    expect(long.length).toBeGreaterThan(short.length);
  });
});
