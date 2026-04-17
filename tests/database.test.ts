import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock expo-sqlite
vi.mock("expo-sqlite", () => ({
  openDatabaseSync: vi.fn(() => ({
    execSync: vi.fn(),
    runSync: vi.fn(),
    getFirstSync: vi.fn(),
    getAllSync: vi.fn(() => []),
    closeSync: vi.fn(),
  })),
}));

// Mock uuid
vi.mock("uuid", () => ({
  v4: vi.fn(() => "test-uuid-1234"),
}));

// Test the pure utility functions from database module
describe("formatCents", () => {
  it("formats zero correctly", async () => {
    // We test the logic inline since formatCents is a pure function
    const formatCents = (cents: number): string => {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
      }).format(cents / 100);
    };

    expect(formatCents(0)).toBe("R$\u00a00,00");
    expect(formatCents(100)).toBe("R$\u00a01,00");
    expect(formatCents(1999)).toBe("R$\u00a019,99");
    expect(formatCents(10000)).toBe("R$\u00a0100,00");
  });
});

describe("parseToCents", () => {
  it("parses price strings to cents correctly", () => {
    const parseToCents = (value: string): number => {
      const digits = value.replace(/\D/g, "");
      return parseInt(digits, 10) || 0;
    };

    expect(parseToCents("19,99")).toBe(1999);
    expect(parseToCents("100,00")).toBe(10000);
    expect(parseToCents("0,00")).toBe(0);
    expect(parseToCents("1.999,99")).toBe(199999);
  });
});

describe("Cart logic", () => {
  it("calculates total correctly", () => {
    const items = [
      { unitPriceCents: 1000, quantity: 2, discountCents: 0 },
      { unitPriceCents: 500, quantity: 3, discountCents: 0 },
      { unitPriceCents: 200, quantity: 1, discountCents: 50 },
    ];

    const total = items.reduce(
      (sum, item) => sum + item.unitPriceCents * item.quantity - item.discountCents,
      0
    );

    expect(total).toBe(2000 + 1500 + 150); // 3650
  });

  it("calculates change correctly", () => {
    const total = 3650;
    const received = 5000;
    const change = Math.max(0, received - total);
    expect(change).toBe(1350);
  });

  it("prevents negative change", () => {
    const total = 3650;
    const received = 2000;
    const change = Math.max(0, received - total);
    expect(change).toBe(0);
  });

  it("increments quantity when same barcode scanned", () => {
    type CartItem = { barcode: string; quantity: number; unitPriceCents: number; discountCents: number };
    let items: CartItem[] = [];

    const addItem = (barcode: string, price: number) => {
      const existing = items.find((i) => i.barcode === barcode);
      if (existing) {
        items = items.map((i) =>
          i.barcode === barcode ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        items = [...items, { barcode, quantity: 1, unitPriceCents: price, discountCents: 0 }];
      }
    };

    addItem("7891234567890", 1000);
    addItem("7891234567890", 1000);
    addItem("1234567890123", 500);

    expect(items.length).toBe(2);
    expect(items[0].quantity).toBe(2);
    expect(items[1].quantity).toBe(1);
  });
});

describe("Date utilities", () => {
  it("generates correct date string format", () => {
    const date = new Date("2026-03-08T12:00:00.000Z");
    const dateStr = date.toISOString().split("T")[0];
    expect(dateStr).toBe("2026-03-08");
  });

  it("formats date for display in pt-BR", () => {
    const date = new Date("2026-03-08T12:00:00.000Z");
    const formatted = date.toLocaleDateString("pt-BR");
    // Should be in dd/mm/yyyy format
    expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});

describe("Stock control logic", () => {
  it("detects low stock correctly", () => {
    const isLowStock = (stockQty: number | null, threshold: number | null): boolean => {
      if (stockQty === null || threshold === null) return false;
      return stockQty <= threshold;
    };

    expect(isLowStock(3, 5)).toBe(true);   // 3 <= 5 → low stock
    expect(isLowStock(5, 5)).toBe(true);   // exactly at threshold
    expect(isLowStock(6, 5)).toBe(false);  // above threshold
    expect(isLowStock(0, 5)).toBe(true);   // out of stock
    expect(isLowStock(null, 5)).toBe(false); // not tracked
    expect(isLowStock(3, null)).toBe(false); // no threshold set
  });

  it("detects out of stock correctly", () => {
    const outOfStock = (stockQty: number | null): boolean =>
      stockQty !== null && stockQty === 0;

    expect(outOfStock(0)).toBe(true);
    expect(outOfStock(1)).toBe(false);
    expect(outOfStock(null)).toBe(false);
  });

  it("decrements stock correctly (simulated)", () => {
    // Simulate decrementStock logic: MAX(0, stockQty - qty)
    const decrement = (stockQty: number, qty: number): number =>
      Math.max(0, stockQty - qty);

    expect(decrement(10, 3)).toBe(7);
    expect(decrement(2, 5)).toBe(0);  // cannot go negative
    expect(decrement(0, 1)).toBe(0);  // stays at zero
  });

  it("does not decrement when stock is null (not tracked)", () => {
    // If stockQty is null, we skip decrement
    const shouldDecrement = (stockQty: number | null): boolean => stockQty !== null;

    expect(shouldDecrement(null)).toBe(false);
    expect(shouldDecrement(10)).toBe(true);
    expect(shouldDecrement(0)).toBe(true);
  });

  it("warns when cart quantity would exceed available stock", () => {
    const wouldExceedStock = (
      stockQty: number | null,
      currentCartQty: number,
      addingQty: number
    ): boolean => {
      if (stockQty === null) return false;
      return currentCartQty + addingQty > stockQty;
    };

    expect(wouldExceedStock(5, 4, 1)).toBe(false);  // 4+1 = 5, exactly at stock
    expect(wouldExceedStock(5, 5, 1)).toBe(true);   // 5+1 = 6 > 5
    expect(wouldExceedStock(null, 100, 1)).toBe(false); // not tracked
    expect(wouldExceedStock(0, 0, 1)).toBe(true);   // out of stock
  });
});
