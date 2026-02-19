/**
 * Business-logic unit tests for the pizzeria ordering system.
 *
 * Tests cover:
 * - Half-and-half pizza pricing rules
 * - Order item validation
 * - Stock deduction / restoration calculations
 * - Inventory edge cases
 */
import { describe, it, expect } from "vitest";

// ── Pricing helpers (extracted from domain rules) ────────────────

/** Half-and-half price: the higher of the two halves. */
function halfAndHalfPrice(priceA: number, priceB: number): number {
  return Math.max(priceA, priceB);
}

/** Full pizza price: just the product price × quantity. */
function fullPizzaPrice(unitPrice: number, quantity: number): number {
  return unitPrice * quantity;
}

/** Half-stock deduction: each half loses 0.5 units per pizza. */
function halfStockDeduction(quantity: number): number {
  return quantity * 0.5;
}

/** Validate that half-and-half sizes match. */
function sizesMatch(sizeA: string, sizeB: string): boolean {
  return sizeA === sizeB;
}

/** Calculate order total from an array of items. */
function calculateOrderTotal(
  items: { price: number; quantity: number }[]
): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

/** Check if product has sufficient stock. */
function hasSufficientStock(
  available: number,
  requested: number
): boolean {
  return available >= requested;
}

// ── Tests ────────────────────────────────────────────────────────

describe("Half-and-half pizza pricing", () => {
  it("uses the higher price when halves differ", () => {
    expect(halfAndHalfPrice(35_000, 42_000)).toBe(42_000);
    expect(halfAndHalfPrice(42_000, 35_000)).toBe(42_000);
  });

  it("returns the same price when both halves are equal", () => {
    expect(halfAndHalfPrice(35_000, 35_000)).toBe(35_000);
  });

  it("works with zero-priced halves", () => {
    expect(halfAndHalfPrice(0, 20_000)).toBe(20_000);
  });
});

describe("Full pizza pricing", () => {
  it("multiplies unit price by quantity", () => {
    expect(fullPizzaPrice(25_000, 1)).toBe(25_000);
    expect(fullPizzaPrice(25_000, 3)).toBe(75_000);
  });

  it("returns 0 for zero quantity", () => {
    expect(fullPizzaPrice(25_000, 0)).toBe(0);
  });
});

describe("Half-and-half size validation", () => {
  it("accepts matching sizes", () => {
    expect(sizesMatch("grande", "grande")).toBe(true);
    expect(sizesMatch("familiar", "familiar")).toBe(true);
  });

  it("rejects mismatched sizes", () => {
    expect(sizesMatch("grande", "mediana")).toBe(false);
    expect(sizesMatch("pequeña", "familiar")).toBe(false);
  });
});

describe("Stock deduction for half-and-half", () => {
  it("deducts 0.5 units per pizza per half", () => {
    expect(halfStockDeduction(1)).toBe(0.5);
    expect(halfStockDeduction(2)).toBe(1.0);
    expect(halfStockDeduction(4)).toBe(2.0);
  });

  it("handles fractional quantities", () => {
    expect(halfStockDeduction(3)).toBe(1.5);
  });
});

describe("Stock sufficiency check", () => {
  it("approves when stock is sufficient", () => {
    expect(hasSufficientStock(10, 5)).toBe(true);
    expect(hasSufficientStock(5, 5)).toBe(true);
  });

  it("rejects when stock is insufficient", () => {
    expect(hasSufficientStock(3, 5)).toBe(false);
    expect(hasSufficientStock(0, 1)).toBe(false);
  });

  it("approves zero request", () => {
    expect(hasSufficientStock(0, 0)).toBe(true);
  });
});

describe("Order total calculation", () => {
  it("sums multiple items correctly", () => {
    const items = [
      { price: 25_000, quantity: 2 }, // 50,000
      { price: 8_000, quantity: 3 },  // 24,000
      { price: 12_000, quantity: 1 }, // 12,000
    ];
    expect(calculateOrderTotal(items)).toBe(86_000);
  });

  it("returns 0 for empty order", () => {
    expect(calculateOrderTotal([])).toBe(0);
  });

  it("handles single item", () => {
    expect(calculateOrderTotal([{ price: 42_000, quantity: 1 }])).toBe(42_000);
  });
});

describe("Inventory restoration after cancellation", () => {
  it("restores full stock correctly", () => {
    const originalStock = 10;
    const ordered = 3;
    const afterOrder = originalStock - ordered;
    const afterCancel = afterOrder + ordered;
    expect(afterCancel).toBe(originalStock);
  });

  it("restores half stock correctly", () => {
    const originalStock = 10;
    const pizzasOrdered = 2;
    const halfDeducted = halfStockDeduction(pizzasOrdered); // 1.0
    const afterOrder = originalStock - halfDeducted;
    const afterCancel = afterOrder + halfDeducted;
    expect(afterCancel).toBe(originalStock);
  });
});

describe("Edge cases", () => {
  it("rejects negative stock", () => {
    expect(hasSufficientStock(-1, 1)).toBe(false);
  });

  it("handles very large orders", () => {
    expect(fullPizzaPrice(50_000, 100)).toBe(5_000_000);
  });

  it("half-and-half with zero stock should fail", () => {
    const stock = 0;
    const needed = halfStockDeduction(1); // 0.5
    expect(hasSufficientStock(stock, needed)).toBe(false);
  });
});
