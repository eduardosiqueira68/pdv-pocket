import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { DayReport, formatCents } from "@/lib/db/database";

/**
 * Generate a PDF report for the day and return the file path
 * On Android/iOS, saves to Documents folder
 * On web, returns a data URL
 */
export async function generateDayReportPDF(
  storeName: string,
  dateStr: string,
  report: DayReport
): Promise<string> {
  // Format date for display
  const dateObj = new Date(dateStr + "T00:00:00");
  const dateDisplay = dateObj.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // Build PDF content as HTML (will be converted to PDF)
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Relatório - ${dateDisplay}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #0a7ea4;
      padding-bottom: 20px;
    }
    .store-name {
      font-size: 28px;
      font-weight: bold;
      color: #0a7ea4;
      margin: 0;
    }
    .report-date {
      font-size: 14px;
      color: #666;
      margin: 5px 0 0 0;
      text-transform: capitalize;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 15px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: #f0f8ff;
      border-left: 4px solid #0a7ea4;
      padding: 15px;
      border-radius: 4px;
    }
    .stat-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #0a7ea4;
    }
    .section-title {
      font-size: 16px;
      font-weight: bold;
      color: #333;
      margin-top: 25px;
      margin-bottom: 15px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 10px;
    }
    .product-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #eee;
      font-size: 13px;
    }
    .product-rank {
      background: #0a7ea4;
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      margin-right: 10px;
      font-size: 11px;
    }
    .product-info {
      flex: 1;
    }
    .product-name {
      font-weight: 600;
      color: #333;
    }
    .product-qty {
      font-size: 12px;
      color: #999;
      margin-top: 2px;
    }
    .product-total {
      font-weight: bold;
      color: #0a7ea4;
      min-width: 80px;
      text-align: right;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #999;
    }
    @media print {
      body { margin: 0; padding: 0; background: white; }
      .container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="store-name">${escapeHtml(storeName)}</h1>
      <p class="report-date">Relatório de Vendas - ${dateDisplay}</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Vendido</div>
        <div class="stat-value">${formatCents(report.totalRevenueCents)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Nº de Vendas</div>
        <div class="stat-value">${report.totalSales}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Ticket Médio</div>
        <div class="stat-value">${formatCents(report.averageTicketCents)}</div>
      </div>
    </div>

    ${
      report.topProducts && report.topProducts.length > 0
        ? `
      <div class="section-title">Top Produtos</div>
      ${report.topProducts
        .map(
          (product, index) => `
        <div class="product-row">
          <div style="display: flex; align-items: center; flex: 1;">
            <div class="product-rank">${index + 1}</div>
            <div class="product-info">
              <div class="product-name">${escapeHtml(product.name)}</div>
              <div class="product-qty">${product.quantity} unidade${product.quantity !== 1 ? "s" : ""}</div>
            </div>
          </div>
          <div class="product-total">${formatCents(product.totalCents)}</div>
        </div>
      `
        )
        .join("")}
    `
        : ""
    }

    <div class="footer">
      <p>Gerado em ${new Date().toLocaleString("pt-BR")}</p>
      <p>PDV Pocket - Sistema de Vendas</p>
    </div>
  </div>
</body>
</html>
  `;

  if (Platform.OS === "web") {
    // On web, return a data URL
    return `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
  }

  // On native, save to file and share
  const fileName = `relatorio-${dateStr}-${Date.now()}.html`;
  const filePath = `${FileSystem.documentDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, htmlContent);

  return filePath;
}

/**
 * Share the generated PDF/HTML report
 */
export async function shareReport(filePath: string, storeName: string, dateStr: string): Promise<void> {
  if (Platform.OS === "web") {
    // On web, open in new window
    window.open(filePath, "_blank");
    return;
  }

  const dateObj = new Date(dateStr + "T00:00:00");
  const dateDisplay = dateObj.toLocaleDateString("pt-BR");

  await Sharing.shareAsync(filePath, {
    mimeType: "text/html",
    dialogTitle: `Compartilhar Relatório - ${dateDisplay}`,
    UTI: "com.apple.webarchive",
  });
}

function escapeHtml(text: string): string {
  if (typeof document !== "undefined") {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
  // Fallback for non-browser environments
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
