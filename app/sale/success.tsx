import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Share, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getSaleById, getSaleItems, formatCents, type Sale, type SaleItem } from "@/lib/db/database";
import * as Haptics from "expo-haptics";

const PAYMENT_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartao: "Cartão",
};

export default function SaleSuccessScreen() {
  const router = useRouter();
  const colors = useColors();
  const { saleId } = useLocalSearchParams<{ saleId: string }>();
  const [sale, setSale] = useState<Sale | null>(null);
  const [items, setItems] = useState<SaleItem[]>([]);

  useEffect(() => {
    if (saleId) loadSale(saleId);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [saleId]);

  const loadSale = async (id: string) => {
    const s = await getSaleById(id);
    const its = await getSaleItems(id);
    setSale(s);
    setItems(its);
  };

  const buildReceipt = () => {
    if (!sale) return "";
    const date = new Date(sale.createdAt);
    const lines = [
      "=============================",
      "        PDV POCKET",
      "=============================",
      `Data: ${date.toLocaleDateString("pt-BR")} ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
      "-----------------------------",
      ...items.map(
        (i) =>
          `${i.nameSnapshot}\n  ${i.quantity}x ${formatCents(i.unitPriceCentsSnapshot)} = ${formatCents(i.lineTotalCents)}`
      ),
      "-----------------------------",
      `TOTAL: ${formatCents(sale.totalCents)}`,
      `Pagamento: ${PAYMENT_LABELS[sale.paymentMethod] || sale.paymentMethod}`,
      ...(sale.receivedCents != null
        ? [
            `Recebido: ${formatCents(sale.receivedCents)}`,
            `Troco: ${formatCents(sale.changeCents ?? 0)}`,
          ]
        : []),
      "=============================",
      "       Obrigado!",
      "=============================",
    ];
    return lines.join("\n");
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: buildReceipt() });
    } catch {
      // ignore
    }
  };

  return (
    <ScreenContainer
      edges={["top", "bottom", "left", "right"]}
      className="flex-1 items-center justify-center px-8"
    >
      <View style={styles.container}>
        {/* Success icon */}
        <View style={[styles.iconCircle, { backgroundColor: colors.success + "20" }]}>
          <IconSymbol name="checkmark.circle.fill" size={64} color={colors.success} />
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>Venda Concluída!</Text>

        {sale && (
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>Total</Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>
                {formatCents(sale.totalCents)}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>Pagamento</Text>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                {PAYMENT_LABELS[sale.paymentMethod]}
              </Text>
            </View>
            {sale.changeCents != null && sale.changeCents > 0 && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.muted }]}>Troco</Text>
                  <Text style={[styles.summaryValue, { color: colors.success }]}>
                    {formatCents(sale.changeCents)}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.shareBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <IconSymbol name="square.and.arrow.up" size={20} color={colors.primary} />
            <Text style={[styles.shareBtnText, { color: colors.primary }]}>Ver Recibo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.newSaleBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.replace("/sale" as any)}
            activeOpacity={0.8}
          >
            <IconSymbol name="barcode.viewfinder" size={22} color="#fff" />
            <Text style={styles.newSaleBtnText}>Nova Venda</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => router.replace("/(tabs)")}
          style={styles.homeLink}
        >
          <Text style={[styles.homeLinkText, { color: colors.muted }]}>Voltar ao Início</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", alignItems: "center", gap: 20 },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 26, fontWeight: "800" },
  summaryCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 18, fontWeight: "700" },
  divider: { height: 0.5, width: "100%" },
  actions: { width: "100%", flexDirection: "row", gap: 12 },
  shareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  shareBtnText: { fontSize: 15, fontWeight: "600" },
  newSaleBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  newSaleBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  homeLink: { marginTop: 4 },
  homeLinkText: { fontSize: 14 },
});
