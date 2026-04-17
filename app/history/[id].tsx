import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Share,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getSaleById, getSaleItems, formatCents, type Sale, type SaleItem } from "@/lib/db/database";

const PAYMENT_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartao: "Cartão",
};

export default function SaleDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [sale, setSale] = useState<Sale | null>(null);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) loadSale(id);
  }, [id]);

  const loadSale = async (saleId: string) => {
    try {
      const s = await getSaleById(saleId);
      const its = await getSaleItems(saleId);
      setSale(s);
      setItems(its);
    } finally {
      setIsLoading(false);
    }
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

  if (isLoading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!sale) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <Text style={{ color: colors.muted }}>Venda não encontrada.</Text>
      </ScreenContainer>
    );
  }

  const date = new Date(sale.createdAt);

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Detalhe da Venda</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <IconSymbol name="square.and.arrow.up" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            {/* Date/time */}
            <View style={[styles.metaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: colors.muted }]}>Data</Text>
                <Text style={[styles.metaValue, { color: colors.foreground }]}>
                  {date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: colors.muted }]}>Horário</Text>
                <Text style={[styles.metaValue, { color: colors.foreground }]}>
                  {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: colors.muted }]}>Pagamento</Text>
                <Text style={[styles.metaValue, { color: colors.foreground }]}>
                  {PAYMENT_LABELS[sale.paymentMethod]}
                </Text>
              </View>
              {sale.receivedCents != null && (
                <>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <View style={styles.metaRow}>
                    <Text style={[styles.metaLabel, { color: colors.muted }]}>Recebido</Text>
                    <Text style={[styles.metaValue, { color: colors.foreground }]}>
                      {formatCents(sale.receivedCents)}
                    </Text>
                  </View>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <View style={styles.metaRow}>
                    <Text style={[styles.metaLabel, { color: colors.muted }]}>Troco</Text>
                    <Text style={[styles.metaValue, { color: colors.success }]}>
                      {formatCents(sale.changeCents ?? 0)}
                    </Text>
                  </View>
                </>
              )}
            </View>

            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Itens</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.itemRow, { borderBottomColor: colors.border }]}>
            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={2}>
                {item.nameSnapshot}
              </Text>
              <Text style={[styles.itemUnit, { color: colors.muted }]}>
                {item.quantity}× {formatCents(item.unitPriceCentsSnapshot)}
              </Text>
            </View>
            <Text style={[styles.itemTotal, { color: colors.foreground }]}>
              {formatCents(item.lineTotalCents)}
            </Text>
          </View>
        )}
        ListFooterComponent={
          <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>
              {formatCents(sale.totalCents)}
            </Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backBtn: { padding: 4, marginRight: 8 },
  title: { flex: 1, fontSize: 20, fontWeight: "700" },
  shareBtn: { padding: 4 },
  list: { padding: 16, paddingBottom: 40 },
  headerContent: { gap: 16, marginBottom: 8 },
  metaCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  metaLabel: { fontSize: 14 },
  metaValue: { fontSize: 14, fontWeight: "600" },
  divider: { height: 0.5, marginHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: "500" },
  itemUnit: { fontSize: 13, marginTop: 2 },
  itemTotal: { fontSize: 15, fontWeight: "700" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    marginTop: 4,
  },
  totalLabel: { fontSize: 16, fontWeight: "700" },
  totalValue: { fontSize: 24, fontWeight: "800" },
});
