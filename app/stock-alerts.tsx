import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getLowStockProducts, formatCents, type Product } from "@/lib/db/database";

export default function StockAlertsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getLowStockProducts();
      setProducts(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const renderItem = ({ item }: { item: Product }) => {
    const outOfStock = item.stockQty === 0;
    const accentColor = outOfStock ? colors.error : colors.warning;

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface, borderColor: accentColor + "50" }]}
        onPress={() => router.push(`/products/${item.id}` as any)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconBox, { backgroundColor: accentColor + "15" }]}>
          <IconSymbol
            name={outOfStock ? "xmark.circle.fill" : "exclamationmark.triangle.fill"}
            size={22}
            color={accentColor}
          />
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.sub, { color: colors.muted }]}>
            {outOfStock
              ? "Sem estoque — reposição necessária"
              : `${item.stockQty} un. restantes (mínimo: ${item.lowStockThreshold})`}
          </Text>
        </View>
        <View style={styles.right}>
          <View style={[styles.badge, { backgroundColor: accentColor + "20" }]}>
            <Text style={[styles.badgeText, { color: accentColor }]}>
              {outOfStock ? "0 un." : `${item.stockQty} un.`}
            </Text>
          </View>
          <Text style={[styles.price, { color: colors.muted }]}>
            {formatCents(item.priceCents)}
          </Text>
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
        <Text style={[styles.title, { color: colors.foreground }]}>Alertas de Estoque</Text>
        {products.length > 0 && (
          <TouchableOpacity onPress={() => router.push("/stock-replenish" as any)} style={styles.actionBtn}>
            <IconSymbol name="plus.circle.fill" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
        {products.length === 0 && <View style={{ width: 40 }} />}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.center}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.success + "15" }]}>
            <IconSymbol name="checkmark.circle.fill" size={48} color={colors.success} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Estoque em dia!
          </Text>
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            Nenhum produto com estoque baixo ou zerado no momento.
          </Text>
        </View>
      ) : (
        <>
          {/* Summary banner */}
          <View style={[styles.banner, { backgroundColor: colors.warning + "15", borderColor: colors.warning + "40" }]}>
            <IconSymbol name="exclamationmark.triangle.fill" size={18} color={colors.warning} />
            <Text style={[styles.bannerText, { color: colors.warning }]}>
              {products.length} produto{products.length !== 1 ? "s" : ""} precisam de reposição
            </Text>
          </View>

          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
          />
        </>
      )}
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
  actionBtn: { padding: 4 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  bannerText: { fontSize: 14, fontWeight: "600", flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: "600" },
  sub: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  right: { alignItems: "flex-end", gap: 4 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: { fontSize: 12, fontWeight: "700" },
  price: { fontSize: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 20, fontWeight: "700" },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});
