import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  getAllProducts,
  searchProducts,
  deactivateProduct,
  formatCents,
  type Product,
} from "@/lib/db/database";
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

export default function ProductsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    try {
      const data = query.trim()
        ? await searchProducts(query.trim())
        : await getAllProducts();
      setProducts(data);
    } catch {
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts])
  );

  const handleDelete = (product: Product) => {
    Alert.alert(
      "Desativar Produto",
      `Deseja desativar "${product.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Desativar",
          style: "destructive",
          onPress: async () => {
            await deactivateProduct(product.id);
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            loadProducts();
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Product }) => {
    const isLowStock =
      item.stockQty !== null &&
      item.lowStockThreshold !== null &&
      item.stockQty <= item.lowStockThreshold;
    const outOfStock = item.stockQty !== null && item.stockQty === 0;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: outOfStock
              ? colors.error + "60"
              : isLowStock
              ? colors.warning + "60"
              : colors.border,
          },
        ]}
        onPress={() => router.push(`/products/${item.id}` as any)}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: outOfStock
                  ? colors.error + "15"
                  : isLowStock
                  ? colors.warning + "15"
                  : colors.primary + "15",
              },
            ]}
          >
            <IconSymbol
              name="cube.box.fill"
              size={22}
              color={outOfStock ? colors.error : isLowStock ? colors.warning : colors.primary}
            />
          </View>
          <View style={styles.info}>
            <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.metaRow}>
              <Text style={[styles.barcode, { color: colors.muted }]} numberOfLines={1}>
                {item.barcode || "Sem código"}
              </Text>
              {item.stockQty !== null && (
                <View
                  style={[
                    styles.stockBadge,
                    {
                      backgroundColor: outOfStock
                        ? colors.error + "20"
                        : isLowStock
                        ? colors.warning + "20"
                        : colors.success + "20",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.stockBadgeText,
                      {
                        color: outOfStock
                          ? colors.error
                          : isLowStock
                          ? colors.warning
                          : colors.success,
                      },
                    ]}
                  >
                    {outOfStock ? "Sem estoque" : `${item.stockQty} un.`}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.right}>
            <Text style={[styles.price, { color: colors.primary }]}>
              {formatCents(item.priceCents)}
            </Text>
            <TouchableOpacity
              onPress={() => handleDelete(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <IconSymbol name="trash.fill" size={18} color={colors.error} />
            </TouchableOpacity>
          </View>
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
        <Text style={[styles.title, { color: colors.foreground }]}>Produtos</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/products/new" as any)}
        >
          <IconSymbol name="plus.circle.fill" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Novo</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <IconSymbol name="magnifyingglass" size={18} color={colors.muted} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Buscar por nome ou código..."
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")}>
            <IconSymbol name="xmark.circle.fill" size={18} color={colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <IconSymbol name="cube.box.fill" size={48} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              {isLoading ? "Carregando..." : "Nenhum produto encontrado"}
            </Text>
            {!isLoading && !query && (
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/products/new" as any)}
              >
                <Text style={styles.emptyBtnText}>Cadastrar primeiro produto</Text>
              </TouchableOpacity>
            )}
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
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
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
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: "600" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  barcode: { fontSize: 12 },
  stockBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stockBadgeText: { fontSize: 11, fontWeight: "700" },
  right: { alignItems: "flex-end", gap: 8 },
  price: { fontSize: 16, fontWeight: "700" },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15 },
  emptyBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});
