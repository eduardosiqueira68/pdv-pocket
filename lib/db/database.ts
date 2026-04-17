import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";
import * as Crypto from "expo-crypto";

// Types
export interface Product {
  id: string;
  barcode: string;
  name: string;
  priceCents: number;
  category: string | null;
  active: boolean;
  updatedAt: string;
  stockQty: number | null;        // null = não controla estoque
  lowStockThreshold: number | null; // null = sem alerta
}

export interface Sale {
  id: string;
  createdAt: string;
  totalCents: number;
  discountTotalCents: number;
  paymentMethod: "dinheiro" | "pix" | "cartao";
  receivedCents: number | null;
  changeCents: number | null;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string | null;
  barcode: string;
  nameSnapshot: string;
  unitPriceCentsSnapshot: number;
  quantity: number;
  discountCents: number;
  lineTotalCents: number;
}

export interface CartItem {
  productId: string | null;
  barcode: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  discountCents: number;
}

export interface DayReport {
  totalSales: number;
  totalRevenueCents: number;
  averageTicketCents: number;
  topProducts: { name: string; quantity: number; totalCents: number }[];
}

export interface StockMovement {
  id: string;
  productId: string;
  type: "entrada" | "saida";
  quantity: number;
  reason: string; // "compra", "devolução", "ajuste", "venda"
  createdAt: string;
}

// Helper: format cents to BRL string
export function formatCents(cents: number): string {
  const value = cents / 100;
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Helper: parse BRL input to cents
export function parseToCents(value: string): number {
  const cleaned = value.replace(/[^\d]/g, "");
  return parseInt(cleaned, 10) || 0;
}

// Calculate line total for a cart item
export function calcLineTotal(item: CartItem): number {
  return item.unitPriceCents * item.quantity - item.discountCents;
}

// Calculate cart total
export function calcCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + calcLineTotal(item), 0);
}

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  if (Platform.OS === "web") {
    // expo-sqlite doesn't support web; use in-memory fallback
    db = await SQLite.openDatabaseAsync(":memory:");
  } else {
    db = await SQLite.openDatabaseAsync("pdvpocket.db");
  }

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY NOT NULL,
      barcode TEXT UNIQUE,
      name TEXT NOT NULL,
      priceCents INTEGER NOT NULL DEFAULT 0,
      category TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY NOT NULL,
      createdAt TEXT NOT NULL,
      totalCents INTEGER NOT NULL DEFAULT 0,
      discountTotalCents INTEGER NOT NULL DEFAULT 0,
      paymentMethod TEXT NOT NULL DEFAULT 'dinheiro',
      receivedCents INTEGER,
      changeCents INTEGER
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY NOT NULL,
      saleId TEXT NOT NULL,
      productId TEXT,
      barcode TEXT NOT NULL,
      nameSnapshot TEXT NOT NULL,
      unitPriceCentsSnapshot INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      discountCents INTEGER NOT NULL DEFAULT 0,
      lineTotalCents INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (saleId) REFERENCES sales(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY NOT NULL,
      productId TEXT NOT NULL,
      type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      reason TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
    CREATE INDEX IF NOT EXISTS idx_sales_createdAt ON sales(createdAt);
    CREATE INDEX IF NOT EXISTS idx_sale_items_saleId ON sale_items(saleId);
    CREATE INDEX IF NOT EXISTS idx_stock_movements_productId ON stock_movements(productId);
    CREATE INDEX IF NOT EXISTS idx_stock_movements_createdAt ON stock_movements(createdAt);
  `);

  // Migration: add stock columns if they don't exist yet (using PRAGMA table_info for robustness)
  try {
    const columns = await db.getAllAsync<any>("PRAGMA table_info(products)");
    const columnNames = columns.map((c: any) => c.name);
    
    if (!columnNames.includes("stockQty")) {
      await db.execAsync(`ALTER TABLE products ADD COLUMN stockQty INTEGER DEFAULT NULL;`);
      console.log("[DB] Added stockQty column");
    }
    
    if (!columnNames.includes("lowStockThreshold")) {
      await db.execAsync(`ALTER TABLE products ADD COLUMN lowStockThreshold INTEGER DEFAULT NULL;`);
      console.log("[DB] Added lowStockThreshold column");
    }
  } catch (e) {
    console.error("[DB] Migration error:", e);
  }

  return db;
}

// ==================== PRODUCTS ====================

export async function getAllProducts(): Promise<Product[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<any>(
    "SELECT * FROM products WHERE active = 1 ORDER BY name ASC"
  );
  return rows.map(mapProduct);
}

export async function searchProducts(query: string): Promise<Product[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<any>(
    "SELECT * FROM products WHERE active = 1 AND (name LIKE ? OR barcode LIKE ?) ORDER BY name ASC",
    [`%${query}%`, `%${query}%`]
  );
  return rows.map(mapProduct);
}

export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<any>(
    "SELECT * FROM products WHERE barcode = ? AND active = 1",
    [barcode]
  );
  return row ? mapProduct(row) : null;
}

export async function getProductById(id: string): Promise<Product | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<any>(
    "SELECT * FROM products WHERE id = ?",
    [id]
  );
  return row ? mapProduct(row) : null;
}

export async function createProduct(data: {
  barcode: string;
  name: string;
  priceCents: number;
  category?: string;
  stockQty?: number | null;
  lowStockThreshold?: number | null;
}): Promise<Product> {
  const database = await getDatabase();
  const id = Crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    await database.runAsync(
      "INSERT INTO products (id, barcode, name, priceCents, category, active, updatedAt, stockQty, lowStockThreshold) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)",
      [id, data.barcode, data.name, data.priceCents, data.category || null, now,
       data.stockQty ?? null, data.lowStockThreshold ?? null]
    );
  } catch (error) {
    console.error("[DB] Error creating product:", error);
    throw error;
  }

  return {
    id,
    barcode: data.barcode,
    name: data.name,
    priceCents: data.priceCents,
    category: data.category || null,
    active: true,
    updatedAt: now,
    stockQty: data.stockQty ?? null,
    lowStockThreshold: data.lowStockThreshold ?? null,
  };
}

export async function updateProduct(
  id: string,
  data: { barcode?: string; name?: string; priceCents?: number; category?: string; stockQty?: number | null; lowStockThreshold?: number | null }
): Promise<void> {
  const database = await getDatabase();
  const now = new Date().toISOString();
  const sets: string[] = ["updatedAt = ?"];
  const values: any[] = [now];

  if (data.barcode !== undefined) {
    sets.push("barcode = ?");
    values.push(data.barcode);
  }
  if (data.name !== undefined) {
    sets.push("name = ?");
    values.push(data.name);
  }
  if (data.priceCents !== undefined) {
    sets.push("priceCents = ?");
    values.push(data.priceCents);
  }
  if (data.category !== undefined) {
    sets.push("category = ?");
    values.push(data.category);
  }
  if (data.stockQty !== undefined) {
    sets.push("stockQty = ?");
    values.push(data.stockQty);
  }
  if (data.lowStockThreshold !== undefined) {
    sets.push("lowStockThreshold = ?");
    values.push(data.lowStockThreshold);
  }

  values.push(id);
  await database.runAsync(
    `UPDATE products SET ${sets.join(", ")} WHERE id = ?`,
    values
  );
}

export async function deactivateProduct(id: string): Promise<void> {
  const database = await getDatabase();
  const now = new Date().toISOString();
  await database.runAsync(
    "UPDATE products SET active = 0, updatedAt = ? WHERE id = ?",
    [now, id]
  );
}

// ==================== STOCK ====================

export async function decrementStock(items: CartItem[]): Promise<void> {
  const database = await getDatabase();
  for (const item of items) {
    if (!item.productId) continue;
    // Atualizar estoque
    await database.runAsync(
      "UPDATE products SET stockQty = MAX(0, COALESCE(stockQty, 0) - ?) WHERE id = ? AND stockQty IS NOT NULL",
      [item.quantity, item.productId]
    );
    // Registrar movimentação de saída (venda)
    await addStockMovement(item.productId, "saida", item.quantity, "venda");
  }
}

export async function getLowStockProducts(): Promise<Product[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<any>(
    `SELECT * FROM products
     WHERE active = 1
       AND stockQty IS NOT NULL
       AND lowStockThreshold IS NOT NULL
       AND stockQty <= lowStockThreshold
     ORDER BY stockQty ASC`
  );
  return rows.map(mapProduct);
}

export async function getLowStockCount(): Promise<number> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<any>(
    `SELECT COUNT(*) as cnt FROM products
     WHERE active = 1
       AND stockQty IS NOT NULL
       AND lowStockThreshold IS NOT NULL
       AND stockQty <= lowStockThreshold`
  );
  return row?.cnt ?? 0;
}

// ==================== SALES ====================

export async function createSale(data: {
  items: CartItem[];
  discountTotalCents: number;
  paymentMethod: "dinheiro" | "pix" | "cartao";
  receivedCents?: number;
  changeCents?: number;
}): Promise<string> {
  const database = await getDatabase();
  const saleId = Crypto.randomUUID();
  const now = new Date().toISOString();
  // Garantir que total nunca seja negativo
  const totalCents = Math.max(0, calcCartTotal(data.items) - data.discountTotalCents);

  await database.runAsync(
    "INSERT INTO sales (id, createdAt, totalCents, discountTotalCents, paymentMethod, receivedCents, changeCents) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      saleId,
      now,
      totalCents,
      data.discountTotalCents,
      data.paymentMethod,
      data.receivedCents ?? null,
      data.changeCents ?? null,
    ]
  );

  for (const item of data.items) {
    const itemId = Crypto.randomUUID();
    const lineTotal = calcLineTotal(item);
    await database.runAsync(
      "INSERT INTO sale_items (id, saleId, productId, barcode, nameSnapshot, unitPriceCentsSnapshot, quantity, discountCents, lineTotalCents) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        itemId,
        saleId,
        item.productId,
        item.barcode,
        item.name,
        item.unitPriceCents,
        item.quantity,
        item.discountCents,
        lineTotal,
      ]
    );
  }

  return saleId;
}

export async function getSalesByDate(dateStr: string): Promise<Sale[]> {
  const database = await getDatabase();
  // Use LIKE prefix to match local date stored in ISO string (YYYY-MM-DD...)
  const rows = await database.getAllAsync<any>(
    "SELECT * FROM sales WHERE createdAt LIKE ? ORDER BY createdAt DESC",
    [`${dateStr}%`]
  );
  return rows.map(mapSale);
}

export async function getSaleById(id: string): Promise<Sale | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<any>(
    "SELECT * FROM sales WHERE id = ?",
    [id]
  );
  return row ? mapSale(row) : null;
}

export async function getSaleItems(saleId: string): Promise<SaleItem[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<any>(
    "SELECT * FROM sale_items WHERE saleId = ?",
    [saleId]
  );
  return rows.map(mapSaleItem);
}

// ==================== REPORTS ====================

export async function getDayReport(dateStr: string): Promise<DayReport> {
  const database = await getDatabase();

  const summary = await database.getFirstAsync<any>(
    "SELECT COUNT(*) as cnt, COALESCE(SUM(totalCents), 0) as total FROM sales WHERE createdAt LIKE ?",
    [`${dateStr}%`]
  );

  const totalSales = summary?.cnt ?? 0;
  const totalRevenueCents = summary?.total ?? 0;
  const averageTicketCents = totalSales > 0 ? Math.round(totalRevenueCents / totalSales) : 0;

  const topRows = await database.getAllAsync<any>(
    `SELECT si.nameSnapshot as name, SUM(si.quantity) as qty, SUM(si.lineTotalCents) as total
     FROM sale_items si
     JOIN sales s ON si.saleId = s.id
     WHERE s.createdAt LIKE ?
     GROUP BY si.nameSnapshot
     ORDER BY qty DESC
     LIMIT 10`,
    [`${dateStr}%`]
  );

  const topProducts = topRows.map((r: any) => ({
    name: r.name,
    quantity: r.qty,
    totalCents: r.total,
  }));

  return { totalSales, totalRevenueCents, averageTicketCents, topProducts };
}

export async function getTodayString(): Promise<string> {
  const now = new Date();
  // Use local date (not UTC) to avoid timezone mismatch on Android
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ==================== MAPPERS ====================

function mapProduct(row: any): Product {
  return {
    id: row.id,
    barcode: row.barcode || "",
    name: row.name,
    priceCents: row.priceCents,
    category: row.category,
    active: row.active === 1,
    updatedAt: row.updatedAt,
    stockQty: row.stockQty ?? null,
    lowStockThreshold: row.lowStockThreshold ?? null,
  };
}

function mapSale(row: any): Sale {
  return {
    id: row.id,
    createdAt: row.createdAt,
    totalCents: row.totalCents,
    discountTotalCents: row.discountTotalCents,
    paymentMethod: row.paymentMethod,
    receivedCents: row.receivedCents,
    changeCents: row.changeCents,
  };
}

function mapSaleItem(row: any): SaleItem {
  return {
    id: row.id,
    saleId: row.saleId,
    productId: row.productId,
    barcode: row.barcode,
    nameSnapshot: row.nameSnapshot,
    unitPriceCentsSnapshot: row.unitPriceCentsSnapshot,
    quantity: row.quantity,
    discountCents: row.discountCents,
    lineTotalCents: row.lineTotalCents,
  };
}

// ==================== STOCK MOVEMENTS ====================

export async function addStockMovement(
  productId: string,
  type: "entrada" | "saida",
  quantity: number,
  reason: string
): Promise<void> {
  const database = await getDatabase();
  const id = Crypto.randomUUID();
  const now = new Date().toISOString();
  
  await database.runAsync(
    "INSERT INTO stock_movements (id, productId, type, quantity, reason, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
    [id, productId, type, quantity, reason, now]
  );
  
  // Update product stock
  if (type === "entrada") {
    await database.runAsync(
      "UPDATE products SET stockQty = COALESCE(stockQty, 0) + ? WHERE id = ?",
      [quantity, productId]
    );
  } else {
    await database.runAsync(
      "UPDATE products SET stockQty = MAX(0, COALESCE(stockQty, 0) - ?) WHERE id = ?",
      [quantity, productId]
    );
  }
}

export async function getStockMovements(productId?: string): Promise<StockMovement[]> {
  const database = await getDatabase();
  let query = "SELECT * FROM stock_movements";
  const params: any[] = [];
  
  if (productId) {
    query += " WHERE productId = ?";
    params.push(productId);
  }
  
  query += " ORDER BY createdAt DESC LIMIT 100";
  
  const rows = await database.getAllAsync<any>(query, params);
  return rows.map((row: any) => ({
    id: row.id,
    productId: row.productId,
    type: row.type,
    quantity: row.quantity,
    reason: row.reason,
    createdAt: row.createdAt,
  }));
}
