import { describe, expect, it } from "vitest";
import { moveId } from "./reorder";

describe("moveId", () => {
  it("swaps an item up with its neighbor", () => {
    expect(moveId(["a", "b", "c"], "b", "up")).toEqual(["b", "a", "c"]);
  });

  it("swaps an item down with its neighbor", () => {
    expect(moveId(["a", "b", "c"], "b", "down")).toEqual(["a", "c", "b"]);
  });

  it("is a no-op moving the first item up", () => {
    expect(moveId(["a", "b", "c"], "a", "up")).toEqual(["a", "b", "c"]);
  });

  it("is a no-op moving the last item down", () => {
    expect(moveId(["a", "b", "c"], "c", "down")).toEqual(["a", "b", "c"]);
  });

  it("is a no-op for an id that isn't in the list", () => {
    expect(moveId(["a", "b", "c"], "z", "up")).toEqual(["a", "b", "c"]);
  });

  it("does not mutate the original array", () => {
    const original = ["a", "b", "c"];
    moveId(original, "b", "up");
    expect(original).toEqual(["a", "b", "c"]);
  });

  it("handles a two-item list correctly in both directions", () => {
    expect(moveId(["a", "b"], "a", "down")).toEqual(["b", "a"]);
    expect(moveId(["a", "b"], "b", "up")).toEqual(["b", "a"]);
  });

  it("is a no-op on a single-item list", () => {
    expect(moveId(["a"], "a", "up")).toEqual(["a"]);
    expect(moveId(["a"], "a", "down")).toEqual(["a"]);
  });
});
