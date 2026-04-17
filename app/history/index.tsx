import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getSalesByDate, formatCents, type Sale } from "@/lib/db/database";

type DateFilter = "today" | "yesterday" | "custom";

const PAYMENT_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartao: "Cartão",
};

const PAYMENT_ICONS: Record<string, any> = {
  dinheiro: "dollarsign.circle.fill",
  pix: "qrcode",
  cartao: "creditcard.fill",
};

function getDateString(filter: DateFilter): string {
  const now = new Date();
  if (filter === "yesterday") {
    now.setDate(now.getDate() - 1);
  }
  // Use local date to avoid UTC timezone mismatch on Android
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function HistoryScreen() {
  const router = useRouter();
  const colors = useColors();
  const [filter, setFilter] = useState<DateFilter>("today");
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSales = useCallback(async () => {
    setIsLoading(true);
    try {
      const dateStr = getDateString(filter);
      const data = await getSalesByDate(dateStr);
      setSales(data);
    } catch {
      setSales([]);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      loadSales();
    }, [loadSales])
  );

  const totalDay = sales.reduce((s, sale) => s + sale.totalCents, 0);

  const renderItem = ({ item }: { item: Sale }) => {
    const date = new Date(item.createdAt);
    const time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => router.push(`/history/${item.id}` as any)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconBox, { backgroundColor: colors.primary + "15" }]}>
          <IconSymbol
            name={PAYMENT_ICONS[item.paymentMethod] || "dollarsign.circle.fill"}
            size={22}
            color={colors.primary}
          />
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardTime, { color: colors.foreground }]}>{time}</Text>
          <Text style={[styles.cardMethod, { color: colors.muted }]}>
            {PAYMENT_LABELS[item.paymentMethod] || item.paymentMethod}
          </Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={[styles.cardTotal, { color: colors.primary }]}>
            {formatCents(item.totalCents)}
          </Text>
          <IconSymbol name="chevron.right" size={16} color={colors.muted} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Histórico</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Date filter */}
      <View style={styles.filterRow}>
        {(["today", "yesterday"] as DateFilter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterBtn,
              {
                backgroundColor: filter === f ? colors.primary : colors.surface,
                borderColor: filter === f ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === f ? "#fff" : colors.foreground },
              ]}
            >
              {f === "today" ? "Hoje" : "Ontem"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Day total */}
      {sales.length > 0 && (
        <View style={[styles.dayTotal, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
          <Text style={[styles.dayTotalLabel, { color: colors.muted }]}>
            {sales.length} {sales.length === 1 ? "venda" : "vendas"}
          </Text>
          <Text style={[styles.dayTotalValue, { color: colors.primary }]}>
            {formatCents(totalDay)}
          </Text>
        </View>
      )}

      {/* List */}
      <FlatList
        data={sales}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <IconSymbol name="list.bullet.rectangle" size={48} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              {isLoading ? "Carregando..." : "Nenhuma venda neste período"}
            </Text>
          </View>
        }
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
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  filterBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: { fontSize: 14, fontWeight: "600" },
  dayTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  dayTotalLabel: { fontSize: 14 },
  dayTotalValue: { fontSize: 20, fontWeight: "800" },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: { flex: 1 },
  cardTime: { fontSize: 16, fontWeight: "600" },
  cardMethod: { fontSize: 13, marginTop: 2 },
  cardRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardTotal: { fontSize: 17, fontWeight: "700" },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15 },
});
