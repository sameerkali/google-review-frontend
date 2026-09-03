import { describe, expect, it } from "vitest";
import { sanitizePhone, validate, validators } from "./validators";

describe("validators.email", () => {
  it("requires a value", () => {
    expect(validators.email("")).toMatch(/required/i);
  });
  it("rejects a string with no @", () => {
    expect(validators.email("not-an-email")).toMatch(/invalid/i);
  });
  it("accepts a well-formed address", () => {
    expect(validators.email("owner@example.com")).toBeNull();
  });
});

describe("validators.phone", () => {
  it("allows an empty value (optional field)", () => {
    expect(validators.phone("")).toBeNull();
  });
  it("rejects fewer than 10 digits", () => {
    expect(validators.phone("12345")).toMatch(/10 digits/i);
  });
  it("rejects non-digit characters", () => {
    expect(validators.phone("123-456-7890")).toMatch(/10 digits/i);
  });
  it("accepts exactly 10 digits", () => {
    expect(validators.phone("9876543210")).toBeNull();
  });
});

describe("validators.password", () => {
  it("allows an empty value (optional - set later)", () => {
    expect(validators.password("")).toBeNull();
  });
  it("rejects fewer than 4 characters", () => {
    expect(validators.password("abc")).toMatch(/4–14/);
  });
  it("rejects more than 14 characters", () => {
    expect(validators.password("a".repeat(15))).toMatch(/4–14/);
  });
  it("accepts a password within range", () => {
    expect(validators.password("abcd1234")).toBeNull();
  });
});

describe("validators.googleReviewUrl / website (real URL parsing)", () => {
  it("allows an empty value (optional field)", () => {
    expect(validators.website("")).toBeNull();
  });
  it("accepts a full https URL", () => {
    expect(validators.website("https://example.com")).toBeNull();
  });
  it("accepts a bare domain, auto-prefixed like the rest of the app does", () => {
    expect(validators.website("example.com")).toBeNull();
  });
  it("rejects a scheme with no host, which a naive startsWith('http') check would have let through", () => {
    expect(validators.website("http://")).toMatch(/valid URL/i);
  });
  it("rejects a string with no domain at all", () => {
    expect(validators.website("not a url")).toMatch(/valid URL/i);
  });
  it("still accepts a syntactically valid but meaningless single-label host (a known limitation, not a regression)", () => {
    expect(validators.website("httpfoo")).toBeNull();
  });
});

describe("validators.price", () => {
  it("allows an empty value (optional field)", () => {
    expect(validators.price("")).toBeNull();
  });
  it("rejects a non-numeric value", () => {
    expect(validators.price("free")).toMatch(/number/i);
  });
  it("accepts a numeric value", () => {
    expect(validators.price("150")).toBeNull();
  });
});

describe("validators required-text fields", () => {
  it("name/serial/code all require a non-blank value", () => {
    expect(validators.name("")).toMatch(/required/i);
    expect(validators.name("   ")).toMatch(/required/i);
    expect(validators.name("Cafe")).toBeNull();
    expect(validators.serial("")).toMatch(/required/i);
    expect(validators.code("")).toMatch(/required/i);
  });
});

describe("validators enum fields", () => {
  it("billingType only accepts the three known values", () => {
    expect(validators.billingType("monthly")).toBeNull();
    expect(validators.billingType("annually")).toBeNull();
    expect(validators.billingType("one_time")).toBeNull();
    expect(validators.billingType("weekly")).toMatch(/monthly/);
  });
  it("type only accepts QR or NFC", () => {
    expect(validators.type("QR")).toBeNull();
    expect(validators.type("NFC")).toBeNull();
    expect(validators.type("BLE")).toMatch(/QR/);
  });
});

describe("sanitizePhone", () => {
  it("strips non-digit characters", () => {
    expect(sanitizePhone("(987) 654-3210")).toBe("9876543210");
  });
  it("caps at 10 digits", () => {
    expect(sanitizePhone("98765432109999")).toBe("9876543210");
  });
});

describe("validate", () => {
  it("collects errors only for the requested fields", () => {
    const errs = validate(["name", "email"], { name: "", email: "not-an-email", phone: "123" });
    expect(Object.keys(errs).sort()).toEqual(["email", "name"]);
    expect(errs.phone).toBeUndefined();
  });

  it("returns no errors when every requested field is valid", () => {
    const errs = validate(["name", "email"], { name: "Cafe", email: "owner@example.com" });
    expect(errs).toEqual({});
  });

  it("falls back to a generic 'required' message for a field with no dedicated validator", () => {
    const errs = validate(["serial"], {});
    expect(errs.serial).toMatch(/required/i);
  });
});
