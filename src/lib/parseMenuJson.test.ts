import { describe, expect, it } from "vitest";
import { MENU_JSON_EXAMPLE, parseMenuJson } from "./parseMenuJson";

describe("parseMenuJson", () => {
  it("rejects invalid JSON", () => {
    const result = parseMenuJson("{not json");
    expect(result.items).toBeUndefined();
    expect(result.error).toMatch(/not valid JSON/i);
  });

  it("rejects valid JSON that isn't an array or {items: [...]}", () => {
    const result = parseMenuJson('{"name": "Cold Brew"}');
    expect(result.items).toBeUndefined();
    expect(result.error).toMatch(/Expected a JSON array/i);
  });

  it("rejects an array containing a non-string, non-object entry", () => {
    const result = parseMenuJson("[42]");
    expect(result.items).toBeUndefined();
    expect(result.error).toMatch(/Expected a JSON array/i);
  });

  it("rejects an array of objects with no items surviving (all blank names)", () => {
    const result = parseMenuJson('[{"name": "   "}, ""]');
    expect(result.items).toBeUndefined();
    expect(result.error).toMatch(/No item names found/i);
  });

  it("parses the documented {id, name, price, category} shape, ignoring id", () => {
    const result = parseMenuJson('[{"id": 1, "name": "Cold Brew", "price": 150, "category": "Drinks"}]');
    expect(result.items).toEqual([{ name: "Cold Brew", price: 150, category: "Drinks" }]);
  });

  it("accepts a plain array of name strings with no price/category", () => {
    const result = parseMenuJson('["Cold Brew", "Cappuccino"]');
    expect(result.items).toEqual([{ name: "Cold Brew" }, { name: "Cappuccino" }]);
  });

  it("accepts the {items: [...]} wrapper shape", () => {
    const result = parseMenuJson('{"items": ["Cold Brew"]}');
    expect(result.items).toEqual([{ name: "Cold Brew" }]);
  });

  it("trims whitespace from names and categories", () => {
    const result = parseMenuJson('[{"name": "  Cold Brew  ", "category": "  Drinks  "}]');
    expect(result.items).toEqual([{ name: "Cold Brew", category: "Drinks", price: undefined }]);
  });

  it("drops a non-numeric or NaN price instead of keeping a bad value", () => {
    const result = parseMenuJson('[{"name": "Cold Brew", "price": "not a number"}]');
    expect(result.items?.[0].price).toBeUndefined();
  });

  it("skips a blank-name string entry without erroring", () => {
    const result = parseMenuJson('["Cold Brew", "   "]');
    expect(result.items).toEqual([{ name: "Cold Brew" }]);
  });

  it("the documented example string itself parses cleanly with 3 items", () => {
    const result = parseMenuJson(MENU_JSON_EXAMPLE);
    expect(result.items).toHaveLength(3);
    expect(result.error).toBeUndefined();
  });
});
